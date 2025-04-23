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
  period?: string;
  actions?: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function SubHeader({ breadcrumb, title, subtitle, badge, period, actions, className, innerClassName }: SubHeaderProps) {
  return (
    <div className="w-full bg-gray-100 pt-6 pb-4 border-b">
      <div className={clsx("max-w-[1440px] mx-auto px-4 md:px-6", innerClassName)}>
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 flex items-center gap-1 mb-1" aria-label="Breadcrumb">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              {item.href ? (
                <Link to={item.href} className="hover:text-blue-600 font-medium">{item.label}</Link>
              ) : (
                <span className="text-gray-900 font-semibold">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Título + Badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-2">{title}</h1>
          {badge && (
            <span className="px-2 py-0.5 text-sm font-medium rounded-full bg-green-100 text-green-700">
              {badge}
            </span>
          )}
        </div>

        {/* Subtítulo */}
        {subtitle && (
          <p className="text-sm text-blue-600 font-medium mt-1">{subtitle}</p>
        )}

        {/* Período */}
        {period && (
          <p className="text-sm text-gray-500 mt-0.5">{period}</p>
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
