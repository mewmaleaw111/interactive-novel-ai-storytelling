export default function Loading() {
  return (
    <main className="profile-branches-page">
      <div className="profile-branches-container">

        {/* Back */}
        <div className="branches-skeleton-back" />

        {/* Header */}
        <header className="profile-branches-header">
          <div className="branches-skeleton-eyebrow" />
          <div className="branches-skeleton-title" />
          <div className="branches-skeleton-description" />
        </header>

        {/* Branch List */}
        <section className="profile-branches-list">

          {[1, 2, 3].map((item) => (
            <article
              key={item}
              className="profile-branch-card branches-skeleton-card"
            >
              <div className="profile-branch-content">

                {/* Cover */}
                <div className="branches-skeleton-cover" />

                {/* Content */}
                <div className="profile-branch-main">

                  <div className="branches-skeleton-meta" />

                  <div className="branches-skeleton-branch-title" />

                  <div className="branches-skeleton-synopsis">
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="branches-skeleton-player" />

                  {/* Progress */}
                  <div className="branches-skeleton-progress">
                    <div className="branches-skeleton-progress-info" />
                    <div className="branches-skeleton-progress-bar" />
                  </div>

                </div>

                {/* Actions */}
                <div className="profile-branch-actions">
                  <div className="branches-skeleton-button" />
                  <div className="branches-skeleton-button" />
                </div>

              </div>
            </article>
          ))}

        </section>

      </div>
    </main>
  );
}