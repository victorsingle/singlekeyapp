import { Calendar, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "../components/DropdownMenu";
import clsx from "clsx";

type CycleCardProps = {
  id: string;
  title: string;
  status: "draft" | "active" | "completed";
  strategicTheme?: string;
  period: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

export function CycleCard({
  id,
  title,
  status,
  strategicTheme,
  period,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: CycleCardProps) {
  const borderColor = {
    draft: "border-l-yellow-400",
    active: "border-l-green-500",
    completed: "border-l-gray-400",
  }[status];

  const badgeColor = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-700",
  }[status];

  const label = {
    draft: "Rascunho",
    active: "Ativo",
    completed: "Concluído",
  }[status];

  return (
    <div
      className={clsx(
        "relative border-l-4 bg-white rounded-xl p-6 shadow-sm transition hover:shadow-md",
        borderColor
      )}
    >
      <div className="flex h-full items-center justify-between">
        <div className="w-full">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
            </div>

            {strategicTheme && (
            <p className="text-blue-600 text-sm font-medium py-2 line-clamp-2">{strategicTheme}</p>
            )}

            <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{period}</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
        <span className={clsx("text-xs px-2 py-1 rounded-full", badgeColor)}>
            {label}
        </span>
            
            <DropdownMenu
                trigger={
                <button className="text-gray-400 hover:text-gray-600 ml-2">
                    <MoreVertical className="w-5 h-5 mt-2" />
                </button>
                }
            >
                {onView && <DropdownMenuItem onClick={onView}>Visualizar</DropdownMenuItem>}
                {canEdit && onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}
                {canDelete && onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    Excluir
                </DropdownMenuItem>
                )}
            </DropdownMenu>
        </div>
        </div>
    </div>
  );
}
