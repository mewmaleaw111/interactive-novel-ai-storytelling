export default function Loading() {
  return (
    <main className="profile-page">
      <div className="profile-container">

        {/* Back */}
        <div className="profile-skeleton-back" />

        {/* Profile Card */}
        <section className="profile-card profile-skeleton-card">
          <div className="profile-skeleton-avatar" />

          <div className="profile-skeleton-info">
            <div className="profile-skeleton-label" />
            <div className="profile-skeleton-name" />
            <div className="profile-skeleton-description" />
          </div>

          <div className="profile-skeleton-edit-button" />
        </section>

        {/* Statistics */}
        <section className="profile-section">
          <div className="profile-skeleton-section-title" />

          <div className="profile-stats">
            <div className="profile-stat-card">
              <div className="profile-skeleton-stat-number" />
              <div className="profile-skeleton-stat-label" />
            </div>

            <div className="profile-stat-card">
              <div className="profile-skeleton-stat-number" />
              <div className="profile-skeleton-stat-label" />
            </div>

            <div className="profile-stat-card">
              <div className="profile-skeleton-stat-number" />
              <div className="profile-skeleton-stat-label" />
            </div>
          </div>
        </section>

        {/* Activities */}
        <section className="profile-section profile-activity-section">
          <div className="profile-skeleton-section-title" />

          <div className="profile-activities">

            <div className="profile-activity-item">
              <div className="profile-skeleton-activity-content">
                <div className="profile-skeleton-activity-title" />
                <div className="profile-skeleton-activity-description" />
              </div>

              <div className="profile-skeleton-arrow" />
            </div>

            <div className="profile-activity-item">
              <div className="profile-skeleton-activity-content">
                <div className="profile-skeleton-activity-title" />
                <div className="profile-skeleton-activity-description" />
              </div>

              <div className="profile-skeleton-arrow" />
            </div>

            <div className="profile-activity-item">
              <div className="profile-skeleton-activity-content">
                <div className="profile-skeleton-activity-title" />
                <div className="profile-skeleton-activity-description" />
              </div>

              <div className="profile-skeleton-arrow" />
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}