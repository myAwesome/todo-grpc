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
const addr = process.env.GRPC_ADDR || 'localhost:50051';
const client = new proto.TodoService(addr, grpc.credentials.createInsecure());

function usage() {
  console.log(`Usage:
  npm run client -- add "buy milk"
  npm run client -- list
  npm run client -- complete 1
  npm run client -- delete 1`);
}

function handleError(err) {
  if (!err) return false;
  console.error(`Error (${err.code}): ${err.message}`);
  process.exit(1);
}

const [, , cmd, ...args] = process.argv;

if (!cmd) {
  usage();
  process.exit(1);
}

if (cmd === 'add') {
  const text = args.join(' ').trim();
  client.AddTodo({ text }, (err, todo) => {
    if (handleError(err)) return;
    console.log(`Added #${todo.id}: ${todo.text}`);
  });
} else if (cmd === 'list') {
  client.ListTodos({}, (err, res) => {
    if (handleError(err)) return;
    if (!res.todos.length) {
      console.log('No todos yet.');
      return;
    }

    for (const t of res.todos) {
      const mark = t.completed ? 'x' : ' ';
      console.log(`[${mark}] ${t.id}: ${t.text}`);
    }
  });
} else if (cmd === 'complete') {
  const id = Number(args[0]);
  if (!Number.isInteger(id)) {
    console.error('complete requires an integer id');
    process.exit(1);
  }

  client.CompleteTodo({ id }, (err, todo) => {
    if (handleError(err)) return;
    console.log(`Completed #${todo.id}: ${todo.text}`);
  });
} else if (cmd === 'delete') {
  const id = Number(args[0]);
  if (!Number.isInteger(id)) {
    console.error('delete requires an integer id');
    process.exit(1);
  }

  client.DeleteTodo({ id }, (err, res) => {
    if (handleError(err)) return;
    console.log(res.deleted ? `Deleted #${id}` : `Did not delete #${id}`);
  });
} else {
  usage();
  process.exit(1);
}
