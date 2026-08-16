import React from 'react';

const routes = [
  { id: 'chap-1', label: '问题与现象' },
  { id: 'chap-3', label: 'Pipeline' },
  { id: 'chap-4', label: '核心方法' },
  { id: 'chap-6', label: '实验与边界' },
];

export function ReportNav() {
  return (
    <nav className="report-nav" aria-label="论文讲解章节">
      <div className="report-nav-inner">
        <div className="report-nav-links">
          {routes.map((route) => (
            <a key={route.id} href={'#' + route.id} className="report-nav-link">
              {route.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
