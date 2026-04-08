const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'todo.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).todo;

const todos = [];
let nextId = 1;

function addTodo(call, callback) {
  const text = (call.request.text || '').trim();
  if (!text) {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: 'text is required' });
    return;
  }

  const todo = { id: nextId++, text, completed: false };
  todos.push(todo);
  callback(null, todo);
}

function listTodos(_call, callback) {
  callback(null, { todos });
}

function completeTodo(call, callback) {
  const id = call.request.id;
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    callback({ code: grpc.status.NOT_FOUND, message: `todo ${id} not found` });
    return;
  }

  todo.completed = true;
  callback(null, todo);
}

function deleteTodo(call, callback) {
  const id = call.request.id;
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) {
    callback({ code: grpc.status.NOT_FOUND, message: `todo ${id} not found` });
    return;
  }

  todos.splice(idx, 1);
  callback(null, { deleted: true });
}

function main() {
  const server = new grpc.Server();
  server.addService(proto.TodoService.service, {
    AddTodo: addTodo,
    ListTodos: listTodos,
    CompleteTodo: completeTodo,
    DeleteTodo: deleteTodo,
  });

  const addr = process.env.GRPC_ADDR || '0.0.0.0:50051';
  server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      process.exit(1);
    }

    console.log(`Todo gRPC server listening on ${addr} (port ${port})`);
    server.start();
  });
}

main();
