const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user)
    return response.status(401).json({
      error: { message: "Unauthorized" },
    });

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  const userExists = users.some((user) => user.username === username);

  if (userExists)
    return response.status(400).json({
      error: {
        message: "User already exists!",
      },
    });

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  let todoExists;

  user.todos = user.todos.map((todo) => {
    if (todo.id === id) {
      todo = {
        ...todo,
        title: title || todo.title,
        deadline: deadline ? new Date(deadline) : todo.deadline,
      };

      todoExists = todo;
    }

    return todo;
  });

  if (!todoExists)
    return response.status(404).json({
      error: {
        message: "Todo not found!",
      },
    });

  return response.status(201).json(todoExists);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  let todoExists;

  user.todos = user.todos.map((todo) => {
    if (todo.id === id) {
      todo.done = true;

      todoExists = todo;
    }

    return todo;
  });

  if (!todoExists)
    return response.status(404).json({
      error: {
        message: "Todo not found!",
      },
    });

  return response.status(401).json(todoExists);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo)
    return response.status(404).json({
      error: {
        message: "Todo not found!",
      },
    });

  user.todos.splice(user, 1);

  return response.status(204).json(todo);
});

module.exports = app;
