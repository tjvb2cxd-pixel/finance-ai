import React from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical, Eye, EyeOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface WidgetConfig {
  id: string;
  visible: boolean;
}

export const WIDGET_DEF = {
  assistant: { label: 'Assistente FIN' },
  summary: { label: 'Resumo Financeiro' },
  banks: { label: 'Contas Conectadas' },
  donut: { label: 'Despesas por Categoria' },
  evolution: { label: 'Evolução Financeira' },
  transactions: { label: 'Últimas Transações' },
};

interface SortableItemProps {
  id: string;
  visible: boolean;
  onToggleVisibility: (id: string) => void;
  key?: React.Key;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, visible, onToggleVisibility }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-xl border ${
        visible 
          ? 'bg-[#0e1830] border-slate-700/80 text-slate-200' 
          : 'bg-[#0b1325]/50 border-slate-800/50 text-slate-500'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="font-medium text-sm">{WIDGET_DEF[id as keyof typeof WIDGET_DEF].label}</span>
      </div>
      <button
        onClick={() => onToggleVisibility(id)}
        className={`p-1.5 rounded-lg transition-colors ${
          visible ? 'text-cyan-400 hover:bg-cyan-950/50' : 'text-slate-600 hover:bg-slate-800'
        }`}
      >
        {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
};

interface DashboardCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  setWidgets: (widgets: WidgetConfig[]) => void;
}

export const DashboardCustomizeModal: React.FC<DashboardCustomizeModalProps> = ({
  isOpen,
  onClose,
  widgets,
  setWidgets,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets(
        arrayMove(
          widgets,
          widgets.findIndex((w) => w.id === active.id),
          widgets.findIndex((w) => w.id === over.id)
        )
      );
    }
  };

  const handleToggleVisibility = (id: string) => {
    setWidgets(
      widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-[#0b1325] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1830]">
          <h2 className="text-lg font-bold text-white tracking-tight">Personalizar Layout</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 mb-4">
            Arraste para reordenar os cards. Clique no olho para ocultar/exibir no painel principal.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {widgets.map((widget) => (
                  <SortableItem
                    key={widget.id}
                    id={widget.id}
                    visible={widget.visible}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </motion.div>
    </div>
  );
};
