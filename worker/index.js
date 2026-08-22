export default {
  fetch(request, env) {
    if (request.method === 'GET') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }
    return new Response('Not found', { status: 404 });
  },
};
