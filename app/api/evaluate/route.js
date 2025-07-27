// Main POST handler: receives query & returns JSON decision

exports.POST = async function (request) {
  // ...implementation will go here...
  return new Response(JSON.stringify({ message: "Not implemented" }), {
    status: 501,
  });
};
