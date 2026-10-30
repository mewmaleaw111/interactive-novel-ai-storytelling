export default function Loading() {
  return (
    <main className="admin-page admin-story-detail">
      <div className="admin-container">

        <div className="admin-page-header">
          <div className="admin-skeleton-back" />
          <div className="admin-skeleton-label" />
          <div className="admin-skeleton-title admin-skeleton-story-title" />
          <div className="admin-skeleton-description" />
        </div>

        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>
            <div className="admin-skeleton-status" />
          </div>

          <div className="admin-detail-grid admin-skeleton-detail-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="admin-detail-item" key={index}>
                <div className="admin-skeleton-detail-label" />
                <div className="admin-skeleton-detail-value" />
              </div>
            ))}
          </div>
        </section>

        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>
          </div>

          <div className="admin-detail-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-detail-item" key={index}>
                <div className="admin-skeleton-detail-label" />
                <div className="admin-skeleton-detail-value" />
              </div>
            ))}
          </div>
        </section>

        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>
          </div>

          <div className="admin-skeleton-text-block">
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>
          </div>

          <div className="admin-skeleton-text-block admin-skeleton-plot">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>
            <div className="admin-skeleton-status" />
          </div>

          <div className="admin-chapter-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="admin-chapter-item" key={index}>
                <div className="admin-skeleton-chapter-number" />

                <div className="admin-chapter-content">
                  <div className="admin-skeleton-chapter-title" />
                  <div className="admin-skeleton-chapter-preview" />
                  <div className="admin-skeleton-chapter-date" />
                </div>

                <div className="admin-skeleton-word-count" />
              </div>
            ))}
          </div>
        </section>

        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>
            <div className="admin-skeleton-status" />
          </div>

          <div className="admin-session-list">
            {Array.from({ length: 2 }).map((_, index) => (
              <div className="admin-session-item" key={index}>
                <div className="admin-skeleton-session-number" />

                <div className="admin-session-content">
                  <div className="admin-session-header">
                    <div>
                      <div className="admin-skeleton-session-title" />
                      <div className="admin-skeleton-session-player" />
                    </div>

                    <div className="admin-skeleton-status" />
                  </div>

                  <div className="admin-session-meta">
                    {Array.from({ length: 4 }).map((_, metaIndex) => (
                      <div key={metaIndex}>
                        <div className="admin-skeleton-meta-label" />
                        <div className="admin-skeleton-meta-value" />
                      </div>
                    ))}
                  </div>

                  <div className="admin-session-footer">
                    <div className="admin-skeleton-session-id" />
                    <div className="admin-skeleton-session-button" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}