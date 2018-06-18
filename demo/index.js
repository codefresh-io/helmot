const
    fp = require('lodash/fp'),
    fs = require('fs'),
    kefir = require('kefir'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    concat = require('concat-stream'),
    { EventEmitter } = require('events');

const
    PUBLIC_FOLDER = "public",
    TAR_UPLOAD_LIMIT = "2mb";

const timeoutCallback = (cb, timeout = 1000)=> {
    let once = fp.once(cb);
    fp.delay(timeout, once.bind(null, new Error('RPC call timed-out')));
    return once;
};

module.exports = class extends EventEmitter {
    constructor({ port = 8080 } = {}){
        super();
        let app = express();

        app.param('repoId', (req, res, next)=> {
            this.emit('request_repo_get', {
                repo_id: req.params.repoId,
                callback: timeoutCallback((err, repo)=> { req.repo = repo; next(err); })
            });
        });

        app.post(
            '/repo/:repoId/chart',
            bodyParser.raw({ type: "*/*", limit: TAR_UPLOAD_LIMIT }),
            (req, res, next)=> {
                this.emit('request_repo_push_chart', {
                    repo_id: req.repo.id,
                    chart: req.body,
                    callback: timeoutCallback((err, chart)=> { err ? next(err) : res.json(chart) })
                });
            }
        );

        app.get(
            '/repo/:repoId/',
            (function(template){
                return (req, res)=> res.send(template({ repo: req.repo }));
            })(fp.template(fs.readFileSync(path.join(__dirname, 'view', 'index.ejs'))))
        );

        app.get(
            '/repo/:repoId/index',
            (req, res, next)=> {
                this.emit('request_repo_index', {
                    repo_id: req.repo.id,
                    callback: timeoutCallback((err, index)=>  err ? next(err) : res.json(index))
                });
            }
        );

        app.delete(
            '/repo/:repoId/:chartId',
            (req, res, next)=> {
                this.emit('request_repo_delete_chart', {
                    repo_id: req.repo.id,
                    chart_id: req.params.chartId,
                    callback: timeoutCallback((err)=> { err ? next(err) : res.json({ status: "OK" }) })
                });
            }
        );


        //app.use((err, req, res, next)=> res.status(500).json(err));

        app.use(express.static(path.join(__dirname, PUBLIC_FOLDER)));

        app.listen(port);
    }
};
