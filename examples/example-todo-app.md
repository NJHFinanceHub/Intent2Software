# Example: Generated To-Do List Application

This document shows what the platform generates when you describe a simple to-do list application.

## User Request

**Initial Description:**
> "Create a to-do list web application where users can add, edit, and delete tasks. Include user authentication and a database to persist tasks."

## AI Conversation

**AI**: "I'd be happy to help you build a to-do list application! To create the best solution, I have a few clarifying questions:

1. **Frontend Framework**: Would you prefer React, Vue, or plain JavaScript?
2. **Styling**: Any specific design system or CSS framework preference?
3. **Authentication**: Should users sign up with email/password, or would you like social login options?
4. **Task Features**: Do you need task categories, due dates, or priority levels?
5. **Database**: Are you okay with PostgreSQL, or would you prefer another database?

**User**: "React with Tailwind CSS. Email/password authentication is fine. Just basic tasks with due dates. PostgreSQL is great."

**AI**: "Perfect! I'll create a complete application with:

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Task list with add/edit/delete functionality
- Due date picker
- User authentication pages (login/signup)

**Backend:**
- Node.js with Express
- PostgreSQL database
- JWT authentication
- RESTful API endpoints

**Features:**
- User registration and login
- Task CRUD operations
- Task completion toggle
- Due date management
- Responsive design

Ready to generate your project? READY_TO_GENERATE"

## Generated Project Structure

```
todo-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── tasks.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   └── Task.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── database.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile
├── .gitignore
└── README.md
```

## Sample Generated Files

### frontend/src/components/TaskList.tsx

```typescript
import { useState, useEffect } from 'react';
import { Task } from '../types';
import { getTasks, deleteTask, toggleTask } from '../services/api';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTask(id);
      setTasks(tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">My Tasks</h1>

      <TaskForm onTaskAdded={loadTasks} />

      <div className="space-y-2 mt-6">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tasks yet. Add your first task above!
          </p>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

### backend/src/routes/tasks.ts

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../database';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all tasks for current user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.user!;
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { userId } = req.user!;
    const { title, description, dueDate } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, due_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, description, dueDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Toggle task completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE tasks SET completed = NOT completed
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.user!;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
```

## Package Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.2",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

## Running the Generated Project

```bash
# Extract the downloaded ZIP
unzip todo-app.zip
cd todo-app

# Start with Docker
docker-compose up

# Or run locally
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Features Included

✅ User registration and login
✅ JWT authentication
✅ Create tasks with title, description, due date
✅ Mark tasks as complete/incomplete
✅ Edit existing tasks
✅ Delete tasks
✅ Responsive design
✅ Form validation
✅ Error handling
✅ Loading states
✅ Docker configuration
✅ TypeScript throughout
✅ Clean, commented code

## What Makes This Special

The generated code includes:
- **Production-ready structure**: Proper organization and best practices
- **Type safety**: Full TypeScript coverage
- **Security**: Password hashing, JWT tokens, SQL injection protection
- **User experience**: Loading states, error messages, responsive design
- **Developer experience**: Clear code, comments, easy to extend

This is just one example. The platform can generate many different types of applications based on your requirements!
