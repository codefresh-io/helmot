let
    fp = require('lodash/fp'),
    DemoServer = require('./demo'),
    repoRegistryFactory = require('./repo_registry'),
    { PassThrough } = require('stream');

let
    registry = repoRegistryFactory({ host: "192.168.99.100" }),
    demoServer = new DemoServer({ port: 8082 });

demoServer.on('request_repo_get', ({ repo_id, callback })=> {
    registry
        .get(repo_id)
        .then(callback.bind(null, null), callback);
});

demoServer.on('request_repo_index', ({ repo_id, callback })=> {
    registry
        .getIndex(repo_id)
        .then(callback.bind(null, null), callback);
});

demoServer.on('request_repo_delete_chart', ({ repo_id, chart_id, callback })=> {
    registry
        .remove(repo_id, chart_id)
        .then(callback.bind(null, null), callback);
});

demoServer.on('request_repo_push_chart', ({ repo_id, chart, callback })=> {
    registry
        .push(repo_id, (function(pt){ pt.end(chart); return pt; })(new PassThrough))
        .then(callback.bind(null, null), callback);
});
