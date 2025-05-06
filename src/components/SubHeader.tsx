import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SubHeaderProps {
  breadcrumb: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClassName?: string;
  period?: string;
  actions?: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function SubHeader({ breadcrumb, title, subtitle, badge, period, actions, className, innerClassName, badgeClassName }: SubHeaderProps) {
  return (
    <div className="w-full bg-gray-100 py-6 border-b">
      <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-10", innerClassName)}>
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 flex items-center gap-1 mb-1" aria-label="Breadcrumb">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              {item.href ? (
                <Link to={item.href} className="hover:text-blue-600 font-normal font-[10px]">{item.label}</Link>
              ) : (
                <span className="text-gray-900 font-normal">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Título + Badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium text-gray-700 pt-2 mb-0">{title}</h1>
          {badge && (
            <span className={clsx("px-2 text-sm font-normal rounded-full ml-auto", badgeClassName ?? "text-gray-600 bg-gray-200")}>
              {badge}
            </span>
          )}
        </div>

        {/* Subtítulo */}
        {subtitle && (
          <p className="text-xs text-blue-500 mt-0.5">{subtitle}</p>
        )}

        {/* Período */}
        {period && (
          <p className="text-xs text-blue-500 mt-0.5">{period}</p>
        )}

        {/* Ações */}
        {actions && (
          <div className="flex gap-2 mt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
