"use client";

import { useMemo } from "react";
import { MemberCard } from "./member-card";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  reports_to: string | null;
  photo_url: string | null;
};

type TreeNode = Member & {
  children: TreeNode[];
};

export function OrganigramChart({ members }: { members: Member[] }) {
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize all nodes
    members.forEach((m) => {
      map.set(m.id, { ...m, children: [] });
    });

    // Build the tree
    members.forEach((m) => {
      const node = map.get(m.id)!;
      if (m.reports_to && map.has(m.reports_to)) {
        map.get(m.reports_to)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [members]);

  if (members.length === 0) {
    return <p className="muted">Aucun membre dans l'organigramme.</p>;
  }

  return (
    <div className="organigram-wrapper">
      <div className="tree">
        <ul>
          {tree.map((root) => (
            <TreeNodeComponent key={root.id} node={root} />
          ))}
        </ul>
      </div>

      <style jsx>{`
        .organigram-wrapper {
          overflow: auto;
          padding: 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          min-height: 500px;
          display: flex;
          justify-content: center;
        }

        .tree ul {
          padding-top: 20px;
          position: relative;
          display: flex;
          justify-content: center;
          gap: 24px;
          margin: 0;
          padding-left: 0;
        }

        .tree li {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 5px 0 5px;
        }

        /* Connecting lines */
        .tree li::before,
        .tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid #94a3b8;
          width: 50%;
          height: 20px;
        }

        .tree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid #94a3b8;
        }

        /* Only one child or root */
        .tree li:only-child::after,
        .tree li:only-child::before {
          display: none;
        }
        .tree li:only-child {
          padding-top: 0;
        }

        /* First and last child borders */
        .tree li:first-child::before,
        .tree li:last-child::after {
          border: 0 none;
        }
        .tree li:last-child::before {
          border-right: 2px solid #94a3b8;
          border-radius: 0 6px 0 0;
        }
        .tree li:first-child::after {
          border-radius: 6px 0 0 0;
        }

        /* Line down from parent */
        .tree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #94a3b8;
          width: 0;
          height: 20px;
          transform: translateX(-50%);
        }

        .node-card {
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          min-width: 160px;
          max-width: 220px;
          position: relative;
          z-index: 1;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .node-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .node-card img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 12px;
          border: 3px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .node-initials {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .node-name {
          font-weight: 600;
          font-size: 15px;
          color: #0f172a;
          line-height: 1.2;
        }

        .node-title {
          font-size: 13px;
          color: #64748b;
          margin-top: 6px;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 20px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .organigram-wrapper {
            padding: 20px 10px;
            justify-content: flex-start;
          }
          
          /* On mobile, collapse horizontal tree to vertical list if it gets too complex, 
             or just let them scroll horizontally. We let them scroll horizontally. */
          .node-card {
            min-width: 140px;
            padding: 12px;
          }
          .node-name {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

function TreeNodeComponent({ node }: { node: TreeNode }) {
  return (
    <li>
      <div className="node-card">
        {node.photo_url ? (
          <img src={node.photo_url} alt="" crossOrigin="anonymous" />
        ) : (
          <div className="node-initials">
            {node.first_name?.[0]}{node.last_name?.[0]}
          </div>
        )}
        <div className="node-name">{node.first_name} {node.last_name}</div>
        <div className="node-title">{node.title || "Membre"}</div>
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
