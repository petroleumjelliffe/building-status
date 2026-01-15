import type { Issue } from '@/types';

interface IssueCardProps {
  issue: Issue;
}

/**
 * IssueCard component - displays current issue
 */
export function IssueCard({ issue }: IssueCardProps) {
  return (
    <div className="issue-card">
      <div className="issue-header">
        {issue.icon && <span className="issue-icon">{issue.icon}</span>}
        <div className="issue-title">
          <h3>{issue.category}</h3>
          <span className="issue-location">{issue.location}</span>
        </div>
        <span className={`issue-status status-${issue.status}`}>
          {issue.status}
        </span>
      </div>
      <p className="issue-detail">{issue.detail}</p>
      <time className="issue-time">
        Reported {new Date(issue.reportedAt).toLocaleDateString()}
      </time>
    </div>
  );
}
