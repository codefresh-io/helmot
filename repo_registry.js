const
    _ = require('lodash'),
    fp = require('lodash/fp'),
    { Pool } = require('pg'),
    fs = require('fs'),
    tar = require('tar-stream'),
    zlib = require('zlib'),
    uuid = require('uuid'),
    path = require('path'),
    kefir = require('kefir'),
    jsYaml = require('js-yaml'),
    crypto = require('crypto'),
    concat = require('concat-stream');

const extractChartMetadata = function (rawChartStream){
        const
            ungzipStream = rawChartStream.pipe(zlib.createUnzip()),
            tarStream = ungzipStream.pipe(tar.extract());

        return kefir
            .fromEvents(tarStream, 'entry', (header, stream, next)=> ({ stream, header, next }))
            .merge(kefir.merge([ungzipStream, tarStream, rawChartStream].map((stream)=> kefir.fromEvents(stream, 'error'))).take(1).flatMap(kefir.constantError))
            .takeUntilBy(kefir.fromEvents(tarStream, 'finish').take(1))
            .flatMap(({ header: { name }, stream, next })=> {
                stream.once('end', next);
                return kefir
                    .fromCallback((cb)=> stream.pipe(concat(cb)))
                    .map((data)=> ({ name, data }));
            })
            .filter(({ name })=> /^[^/]*\/Chart\.yaml$/i.test(name))
            .map(_.flow(_.property('data'), _.toString, jsYaml.safeLoad))
            .beforeEnd(()=> new Error('Chart file wasn\'t found'))
            .take(1)
            .flatMap((data)=> kefir[_.isError(data) ? "constantError" : "constant" ](data))
            .takeErrors(1)
            .toPromise();
    },
    getSha256 = function(rawStream){
        let shaStream = rawStream.pipe(crypto.createHash('sha256'));
        return kefir
            .merge([
                kefir.fromEvents(shaStream, 'data'),
                kefir.fromEvents(shaStream, 'error').take(1).flatMap(kefir.constantError)
            ])
            .take(1)
            .takeErrors(1)
            .map((buf)=> buf.toString('hex'))
            .toPromise();
    };

module.exports = function({
    host = "192.168.99.100",
    user = "postgres",
    password = "password",
    database = "postgres",
    cache_folder = path.join(__dirname, '.data', '.cache')
} = {}){

    const client = new Pool({ host, user, password, database });
    client.connect();

    return {
        create(name, urlTemplate = ""){
            const id = uuid();
            return kefir
                .fromPromise(client.query('INSERT INTO repo (id, name, url_template) VALUES ($1, $2, $3);', [id, name, urlTemplate]))
                .map(fp.always({ id, name, url_template: urlTemplate }))
                .toPromise();
        },
        get(repoId){
            return kefir
                .fromPromise(client.query('SELECT name, url_template FROM repo WHERE id = $1', [repoId]))
                .flatMap(({ rows })=> rows.length ? kefir.constant(fp.first(rows)) : kefir.constantError(new Error('Repository not found')))
                .map(fp.defaults({ id: repoId }))
                .toPromise();
        },
        getIndex(repoId, urlTransformer = (hash, name, version, url)=> `https://${url}/${[[name, version].join('-'), 'tgz'].join('.')}`){
            return kefir
                .fromPromise(this.get(repoId))
                .flatMap(({ url_template })=>
                    kefir
                        .fromPromise(client.query('SELECT id, name, version, raw FROM chart WHERE id IN (SELECT chart FROM chart_to_repo WHERE repo = $1);', [repoId]))
                        .map(fp.pipe(fp.get('rows'), fp.map(({ id, name, version, raw })=> ({
                            digest: id,
                            urls: [urlTransformer(id, name, version, url_template)],
                            ...JSON.parse(raw)
                        })))) //fp.defaults({ generated: new Date() })
                )
                .toPromise();
        },
        remove(repoId, chartId){
            return kefir
                .fromPromise(client.query('DELETE FROM chart_to_repo WHERE chart = $1 AND repo = $2;', [chartId, repoId]))
                .toPromise();
        },
        push(repoId, tarFileStream){
            return kefir
                .combine([
                    kefir.fromCallback((cb)=> tarFileStream.pipe(concat(cb))),
                    ...[
                        extractChartMetadata,
                        getSha256
                    ].map((func)=> kefir.fromPromise(func(tarFileStream)))
                ])
                .mapErrors(()=> Object.assign(new Error(), { "message": "Failed to extract chart metadata", "code": "METADATA_ERR" }))
                .takeErrors(1)
                .flatMap(([data, chart, hash])=> {
                    let { name, version, description } = chart;
                    return kefir
                        .fromPromise(client.query('INSERT INTO chart (id, name, version, description, raw) VALUES ($1, $2, $3, $4, $5);', [hash, name, version, description, JSON.stringify(chart)]))
                        .flatMapErrors((err)=> kefir[err["code"] === "23505" ? "constant" : "constantError"](err))
                        .flatMap(()=> kefir.fromPromise(client.query('INSERT INTO chart_to_repo (chart, repo) VALUES ($1, $2);', [hash, repoId])))
                        //.mapErrors(({ code })=> Object.assign(new Error(), code ===  "23505" ? { message: "Chart already exists", code: "CHART_EXISTS" } : { message: "Unspecified", code: "UNSPECIFIED" }))
                        .map(fp.always(Object.assign(chart, { id: hash })));
                })
                .toPromise();
        }
    };
};
