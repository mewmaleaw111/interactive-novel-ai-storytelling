export default function Loading() {
  return (
    <main className="admin-page admin-session-detail">
      <div className="admin-container">

        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-skeleton-back" />
          <div className="admin-skeleton-label" />
          <div className="admin-skeleton-title admin-skeleton-session-page-title" />
          <div className="admin-skeleton-description" />
        </div>

        {/* SESSION INFORMATION */}
        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>

            <div className="admin-skeleton-status" />
          </div>

          <div className="admin-detail-grid">
            {Array.from({ length: 10 }).map((_, index) => (
              <div className="admin-detail-item" key={index}>
                <div className="admin-skeleton-detail-label" />
                <div className="admin-skeleton-detail-value" />
              </div>
            ))}
          </div>
        </section>

        {/* STORY INFORMATION */}
        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>

            <div className="admin-skeleton-status" />
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

        {/* CHAPTERS */}
        <section className="admin-detail-card">
          <div className="admin-detail-header">
            <div>
              <div className="admin-skeleton-section-title" />
              <div className="admin-skeleton-section-description" />
            </div>

            <div className="admin-skeleton-status" />
          </div>

          <div className="admin-chapter-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-chapter-item" key={index}>

                <div className="admin-skeleton-chapter-number" />

                <div className="admin-chapter-content">
                  <div className="admin-skeleton-chapter-title" />
                  <div className="admin-skeleton-chapter-source" />
                  <div className="admin-skeleton-chapter-preview" />
                  <div className="admin-skeleton-chapter-preview short" />
                  <div className="admin-skeleton-chapter-date" />
                </div>

                <div className="admin-skeleton-word-count" />

              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}