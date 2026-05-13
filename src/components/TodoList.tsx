import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { TodoItem } from "../types";
import { CheckCircle2, Circle } from "lucide-react";

interface TodoListProps {
  todos: TodoItem[];
  onToggle: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onToggle }) => {
  if (todos.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-8 items-center max-w-[280px] mx-auto z-30">
      <AnimatePresence>
        {todos.map((todo, i) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onToggle(todo.id)}
            className="glass px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer group hover:bg-white/20 transition-all border-none"
          >
            {todo.completed ? (
              <CheckCircle2 className="w-4 h-4 text-white/40" />
            ) : (
              <Circle className="w-4 h-4 text-white hover:text-white/80" />
            )}
            <span className={todo.completed ? "text-white/30 line-through text-xs" : "text-white text-xs font-medium"}>
              {todo.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
