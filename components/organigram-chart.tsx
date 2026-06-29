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
  office_role?: string | null;
};

type TreeNode = Member & {
  children: TreeNode[];
};

function formatRole(role: string | null | undefined, title: string | null | undefined) {
  if (role === 'president') return "Président(e)";
  if (role === 'vice_president') return "Vice-Président(e)";
  if (role === 'secretaire') return "Secrétaire";
  if (role === 'tresorier') return "Trésorier(e)";
  if (role === 'commissaire') return "Commissaire";
  return title || "Membre";
}

export function OrganigramChart({ members }: { members: Member[] }) {
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    const president = members.find(m => m.office_role === 'president' || m.title?.toLowerCase().includes('président'));
    const vicePresident = members.find(m => m.office_role === 'vice_president' || m.title?.toLowerCase().includes('vice'));
    const secretaire = members.find(m => m.office_role === 'secretaire' || m.title?.toLowerCase().includes('secrétaire'));

    const enrichedMembers = members.map(m => {
      let reportsTo = m.reports_to;
      
      if (!reportsTo && m.id !== president?.id) {
        if (m.id === vicePresident?.id) {
          reportsTo = president?.id || null;
        } else if (m.office_role === 'secretaire' || m.office_role === 'tresorier' || m.office_role === 'commissaire' || ['secrétaire', 'trésorier', 'commissaire', 'organisation', 'communication', 'délégué'].some(t => m.title?.toLowerCase().includes(t))) {
          reportsTo = vicePresident?.id || president?.id || null;
        } else {
          reportsTo = secretaire?.id || vicePresident?.id || president?.id || null;
        }
      }
      return { ...m, inferred_reports_to: reportsTo };
    });

    // Initialize all nodes
    enrichedMembers.forEach((m) => {
      map.set(m.id, { ...m, reports_to: m.inferred_reports_to, children: [] });
    });

    // Build the tree
    enrichedMembers.forEach((m) => {
      const node = map.get(m.id)!;
      if (m.inferred_reports_to && map.has(m.inferred_reports_to)) {
        // Prevent infinite loops just in case
        if (m.inferred_reports_to !== m.id) {
          map.get(m.inferred_reports_to)!.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort children: president first, then vice_president, then others
    const roleWeight = (role: string | null | undefined) => {
      if (role === 'president') return 0;
      if (role === 'vice_president') return 1;
      if (role === 'secretaire') return 2;
      if (role === 'tresorier') return 3;
      if (role === 'commissaire') return 4;
      return 5;
    };
    
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const wA = roleWeight(a.office_role);
        const wB = roleWeight(b.office_role);
        if (wA !== wB) return wA - wB;
        return a.last_name.localeCompare(b.last_name);
      });
      nodes.forEach(n => sortNodes(n.children));
    };
    
    sortNodes(roots);
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

      <style jsx global>{`
        .organigram-wrapper {
          overflow: auto;
          padding: 60px 40px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          min-height: 500px;
          box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
          position: relative;
        }

        /* Subtle background pattern */
        .organigram-wrapper::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.5;
          pointer-events: none;
        }

        /* Horizontal Tree Layout */
        .tree ul {
          padding-left: 40px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin: 0;
          list-style: none;
        }

        .tree > ul {
          padding-left: 0;
        }

        .tree li {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 40px;
        }

        .tree > ul > li {
          padding-left: 0;
        }

        /* Connecting lines */
        .tree li::before, .tree li::after {
          content: '';
          position: absolute;
          left: 0;
        }

        /* Horizontal line to the node */
        .tree li::before {
          border-top: 2px solid #cbd5e1;
          top: 50%;
          width: 40px;
          height: 0;
        }

        /* Vertical line connecting siblings */
        .tree li::after {
          border-left: 2px solid #cbd5e1;
          height: 100%;
          top: 0;
          width: 0;
        }

        /* Adjust first and last child vertical lines */
        .tree li:first-child::after {
          height: 50%;
          top: 50%;
          border-top-left-radius: 12px;
        }
        .tree li:last-child::after {
          height: 50%;
          bottom: 50%;
          top: auto;
          border-bottom-left-radius: 12px;
        }
        .tree li:only-child::after {
          display: none;
        }

        /* Hide lines for root node */
        .tree > ul > li::before, .tree > ul > li::after {
          display: none;
        }

        /* Line from parent to children group */
        .tree ul::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          border-top: 2px solid #cbd5e1;
          width: 40px;
        }
        .tree > ul::before {
          display: none;
        }

        /* Card Styling */
        .node-card {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          color: #1f2937;
          padding: 12px 16px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          min-width: 280px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          z-index: 1;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        
        .node-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: #3b82f6;
        }

        /* Hierarchical Colors via borders */
        .tree > ul > li > .node-card {
          border-left: 6px solid #2563eb; /* President */
          background: #ffffff;
        }
        
        .tree > ul > li > ul > li > .node-card {
          border-left: 6px solid #10b981; /* Vice President / Bureau */
        }

        .tree > ul > li > ul > li > ul > li > .node-card {
          border-left: 6px solid #f59e0b; /* Third level */
        }

        .node-photo {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          object-fit: cover;
          margin-right: 16px;
          background: #e2e8f0;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .node-initials {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          margin-right: 16px;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          letter-spacing: 1px;
        }

        .node-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }

        .node-name {
          font-weight: 700;
          font-size: 15px;
          color: #111827;
          margin-bottom: 2px;
        }

        .node-title {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
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
          <img src={node.photo_url} alt="" className="node-photo" crossOrigin="anonymous" />
        ) : (
          <div className="node-initials">
            {node.first_name?.[0]}{node.last_name?.[0]}
          </div>
        )}
        <div className="node-info">
          <div className="node-name">{node.first_name} {node.last_name}</div>
          <div className="node-title">{formatRole(node.office_role, node.title)}</div>
        </div>
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
