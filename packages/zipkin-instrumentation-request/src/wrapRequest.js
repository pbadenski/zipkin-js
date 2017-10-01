const {
  Request,
  Annotation,
  Instrumentation
} = require('zipkin');

function wrapRequest(request, {tracer, serviceName = 'unknown', remoteServiceName}) {
  const instrumentation = new Instrumentation.HttpClient({ tracer });
  return request.defaults((options, callback) => tracer.scoped(() => {
    const method = options.method || 'GET';
    const url = options.uri || options.url;
    const wrappedOptions = instrumentation.recordRequest(serviceName, options, remoteServiceName, url, method);
    const traceId = tracer.id;

    const recordResponse = (response) => {
      instrumentation.recordResponse(traceId, response.statusCode);
    };

    const recordError = (error) => {
      instrumentation.recordError(traceId, error);
    };

    return request(wrappedOptions, callback)
      .on('response', recordResponse)
      .on('error', recordError);
  }));
}

module.exports = wrapRequest;
