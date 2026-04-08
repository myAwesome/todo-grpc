# todo-grpc

Minimal Todo app over gRPC (Node.js) with a server and CLI client.

## Setup

```bash
npm install
```

## Run server

```bash
npm run server
```

By default it listens on `0.0.0.0:50051`. Override with:

```bash
GRPC_ADDR=0.0.0.0:50052 npm run server
```

## Run client

In another terminal:

```bash
npm run client -- add "buy milk"
npm run client -- list
npm run client -- complete 1
npm run client -- delete 1
```

If needed, point client at another address:

```bash
GRPC_ADDR=localhost:50052 npm run client -- list
```
