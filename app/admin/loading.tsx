export default function AdminLoading() {
  return (
    <main className="admin-page admin-dashboard">
      <div className="admin-container">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <header className="admin-page-header">
          <div className="admin-header-title">
            <div className="admin-skeleton admin-dashboard-skeleton-header-icon" />

            <div>
              <div className="admin-skeleton admin-dashboard-skeleton-label" />

              <div className="admin-skeleton admin-dashboard-skeleton-title" />

              <div className="admin-skeleton admin-dashboard-skeleton-description" />
            </div>
          </div>
        </header>


        {/* =====================================================
            MAIN STATISTICS
        ====================================================== */}
        <section className="admin-dashboard-section">
          <div className="admin-dashboard-skeleton-section-heading">
            <div className="admin-skeleton admin-dashboard-skeleton-kicker" />

            <div className="admin-skeleton admin-dashboard-skeleton-heading" />

            <div className="admin-skeleton admin-dashboard-skeleton-subheading" />
          </div>

          <div className="admin-dashboard-stats">
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
          </div>
        </section>


        {/* =====================================================
            MANAGEMENT
        ====================================================== */}
        <section className="admin-dashboard-section">
          <div className="admin-dashboard-skeleton-section-heading">
            <div className="admin-skeleton admin-dashboard-skeleton-kicker" />

            <div className="admin-skeleton admin-dashboard-skeleton-heading" />

            <div className="admin-skeleton admin-dashboard-skeleton-subheading" />
          </div>

          <div className="admin-menu-grid">
            <DashboardMenuSkeleton />
            <DashboardMenuSkeleton />
          </div>
        </section>


        {/* =====================================================
            STORY SESSIONS
        ====================================================== */}
        <section className="admin-dashboard-section">
          <div className="admin-dashboard-skeleton-section-heading">
            <div className="admin-skeleton admin-dashboard-skeleton-kicker" />

            <div className="admin-skeleton admin-dashboard-skeleton-heading" />

            <div className="admin-skeleton admin-dashboard-skeleton-subheading" />
          </div>

          <div className="admin-dashboard-overview">
            <DashboardOverviewSkeleton />
            <DashboardOverviewSkeleton />
            <DashboardOverviewSkeleton />
          </div>
        </section>


        {/* =====================================================
            STORY STATUS
        ====================================================== */}
        <section className="admin-dashboard-breakdown">
          <div className="admin-dashboard-skeleton-section-heading">
            <div className="admin-skeleton admin-dashboard-skeleton-kicker" />

            <div className="admin-skeleton admin-dashboard-skeleton-heading" />

            <div className="admin-skeleton admin-dashboard-skeleton-subheading" />
          </div>

          <div className="admin-dashboard-breakdown-grid">
            <DashboardBreakdownSkeleton />
            <DashboardBreakdownSkeleton />
            <DashboardBreakdownSkeleton />
            <DashboardBreakdownSkeleton />
          </div>
        </section>

      </div>
    </main>
  );
}


/* =========================================================
   STAT SKELETON
========================================================= */

function DashboardStatSkeleton() {
  return (
    <div className="admin-stat-card admin-dashboard-stat-skeleton">
      <div className="admin-skeleton admin-dashboard-skeleton-stat-icon" />

      <div className="admin-stat-content">
        <div className="admin-skeleton admin-dashboard-skeleton-stat-label" />

        <div className="admin-skeleton admin-dashboard-skeleton-stat-value" />

        <div className="admin-skeleton admin-dashboard-skeleton-stat-description" />
      </div>
    </div>
  );
}


/* =========================================================
   MANAGEMENT SKELETON
========================================================= */

function DashboardMenuSkeleton() {
  return (
    <div className="admin-menu-card admin-dashboard-menu-skeleton">
      <div className="admin-skeleton admin-dashboard-skeleton-menu-icon" />

      <div className="admin-menu-content">
        <div className="admin-dashboard-skeleton-menu-top">
          <div className="admin-skeleton admin-dashboard-skeleton-menu-title" />

          <div className="admin-skeleton admin-dashboard-skeleton-menu-arrow" />
        </div>

        <div className="admin-skeleton admin-dashboard-skeleton-menu-description" />

        <div className="admin-skeleton admin-dashboard-skeleton-menu-link" />
      </div>
    </div>
  );
}


/* =========================================================
   SESSION SKELETON
========================================================= */

function DashboardOverviewSkeleton() {
  return (
    <div className="admin-overview-card admin-dashboard-overview-skeleton">
      <div className="admin-skeleton admin-dashboard-skeleton-overview-icon" />

      <div className="admin-overview-content">
        <div className="admin-skeleton admin-dashboard-skeleton-overview-label" />

        <div className="admin-skeleton admin-dashboard-skeleton-overview-value" />

        <div className="admin-skeleton admin-dashboard-skeleton-overview-description" />
      </div>
    </div>
  );
}


/* =========================================================
   BREAKDOWN SKELETON
========================================================= */

function DashboardBreakdownSkeleton() {
  return (
    <div className="admin-breakdown-item admin-dashboard-breakdown-skeleton">
      <div className="admin-skeleton admin-dashboard-skeleton-breakdown-icon" />

      <div>
        <div className="admin-skeleton admin-dashboard-skeleton-breakdown-label" />

        <div className="admin-skeleton admin-dashboard-skeleton-breakdown-value" />
      </div>
    </div>
  );
}