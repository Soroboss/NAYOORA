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
          overflow-x: auto;
          padding: 24px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          min-height: 500px;
        }

        /* 
          CSS Tree based on flexbox/pseudo-elements 
          Adapted from classic CSS Family Tree solutions 
        */
        .tree ul {
          padding-top: 20px;
          position: relative;
          transition: all 0.5s;
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .tree li {
          float: left;
          text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 5px 0 5px;
          transition: all 0.5s;
        }

        /* Connecting lines */
        .tree li::before,
        .tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid #cbd5e1;
          width: 50%;
          height: 20px;
        }

        .tree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid #cbd5e1;
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
          border-right: 2px solid #cbd5e1;
          border-radius: 0 5px 0 0;
        }
        .tree li:first-child::after {
          border-radius: 5px 0 0 0;
        }

        /* Line down from parent */
        .tree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #cbd5e1;
          width: 0;
          height: 20px;
        }

        .node-card {
          border: 1px solid #e2e8f0;
          padding: 16px;
          border-radius: 12px;
          display: inline-block;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          min-width: 180px;
          position: relative;
          z-index: 1;
        }

        .node-card img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 8px;
          border: 2px solid #f1f5f9;
        }

        .node-initials {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0f172a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          margin: 0 auto 8px auto;
        }

        .node-name {
          font-weight: 600;
          font-size: 14px;
          color: #0f172a;
        }

        .node-title {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
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
