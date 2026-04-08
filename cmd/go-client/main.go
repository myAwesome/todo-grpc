package main

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	"todo-grpc/gen/todopb"
)

const defaultAddr = "localhost:50051"

func usage() {
	fmt.Println(`Usage:
  go run ./cmd/go-client -- add "buy milk"
  go run ./cmd/go-client -- list
  go run ./cmd/go-client -- complete 1
  go run ./cmd/go-client -- delete 1`)
}

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(1)
	}

	addr := os.Getenv("GRPC_ADDR")
	if strings.TrimSpace(addr) == "" {
		addr = defaultAddr
	}

	conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		fmt.Fprintf(os.Stderr, "dial %s failed: %v\n", addr, err)
		os.Exit(1)
	}
	defer conn.Close()

	client := todopb.NewTodoServiceClient(conn)
	argv := os.Args[1:]
	if len(argv) > 0 && argv[0] == "--" {
		argv = argv[1:]
	}
	if len(argv) == 0 {
		usage()
		os.Exit(1)
	}
	cmd := argv[0]
	args := argv[1:]

	switch cmd {
	case "add":
		text := strings.TrimSpace(strings.Join(args, " "))
		callAndExit(func(ctx context.Context) error {
			todo, err := client.AddTodo(ctx, &todopb.AddTodoRequest{Text: text})
			if err != nil {
				return err
			}
			fmt.Printf("Added #%d: %s\n", todo.Id, todo.Text)
			return nil
		})
	case "list":
		callAndExit(func(ctx context.Context) error {
			res, err := client.ListTodos(ctx, &todopb.ListTodosRequest{})
			if err != nil {
				return err
			}
			if len(res.Todos) == 0 {
				fmt.Println("No todos yet.")
				return nil
			}
			for _, t := range res.Todos {
				mark := " "
				if t.Completed {
					mark = "x"
				}
				fmt.Printf("[%s] %d: %s\n", mark, t.Id, t.Text)
			}
			return nil
		})
	case "complete", "delete":
		if len(args) < 1 {
			fmt.Fprintf(os.Stderr, "%s requires an integer id\n", cmd)
			os.Exit(1)
		}
		id, err := strconv.Atoi(args[0])
		if err != nil {
			fmt.Fprintf(os.Stderr, "%s requires an integer id\n", cmd)
			os.Exit(1)
		}
		callAndExit(func(ctx context.Context) error {
			if cmd == "complete" {
				todo, err := client.CompleteTodo(ctx, &todopb.CompleteTodoRequest{Id: int32(id)})
				if err != nil {
					return err
				}
				fmt.Printf("Completed #%d: %s\n", todo.Id, todo.Text)
				return nil
			}
			res, err := client.DeleteTodo(ctx, &todopb.DeleteTodoRequest{Id: int32(id)})
			if err != nil {
				return err
			}
			if res.Deleted {
				fmt.Printf("Deleted #%d\n", id)
			} else {
				fmt.Printf("Did not delete #%d\n", id)
			}
			return nil
		})
	default:
		usage()
		os.Exit(1)
	}
}

func callAndExit(fn func(context.Context) error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := fn(ctx); err != nil {
		if s, ok := status.FromError(err); ok {
			fmt.Fprintf(os.Stderr, "Error (%s): %s\n", s.Code(), s.Message())
		} else {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		}
		os.Exit(1)
	}
}
