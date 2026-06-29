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
          padding: 40px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          min-height: 500px;
        }

        /* Horizontal Tree Layout */
        .tree ul {
          padding-left: 30px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          padding-left: 30px;
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
          width: 30px;
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
        }
        .tree li:last-child::after {
          height: 50%;
          bottom: 50%;
          top: auto;
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
          width: 30px;
        }
        .tree > ul::before {
          display: none;
        }

        /* Card Styling to match the image */
        .node-card {
          display: flex;
          align-items: center;
          background: #333333; /* Dark background like in the image */
          color: white;
          padding: 12px;
          border-radius: 8px;
          border: 3px solid #cbd5e1; /* Light border */
          min-width: 250px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 1;
        }

        /* Alternating colors for depth or branches could be added, but we stick to dark for root and slightly lighter for others */
        .tree > ul > li > .node-card {
          background: #222222; /* Root is darker */
          border-color: #94a3b8;
        }
        
        .tree > ul > li > ul > li > .node-card {
          background: #d4a373; /* Orange/Brownish like in the image for level 2 */
          border-color: #faedcd;
          color: #333;
        }

        .tree > ul > li > ul > li > ul > li > .node-card {
          background: #4a4036; /* Darker brown for level 3 */
          border-color: #e2e8f0;
        }

        .node-photo {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          object-fit: cover;
          margin-right: 16px;
          background: #e2e8f0;
        }

        .node-initials {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          background: #64748b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          margin-right: 16px;
        }

        .node-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }

        .node-name {
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .node-title {
          font-size: 12px;
          opacity: 0.9;
        }
        
        .node-action {
          margin-top: 4px;
          font-size: 12px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: bold;
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
