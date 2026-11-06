import React from 'react';
import SearchHero from './SearchHero';
import JobCard from './JobCard';
import JobDetail from './JobDetail';

export default function CandidateDashboard({
  currentTab,
  jobs,
  selectedJob,
  onSelectJob,
  appliedJobs,
  savedJobs,
  candidate,
  loading,
  resultsCountLabel,
  searchMetaLabel,
  keyword,
  setKeyword,
  location,
  setLocation,
  onSearch,
  onClearSearch,
  filterExperience,
  setFilterExperience,
  filterLocation,
  setFilterLocation,
  filterWorkMode,
  setFilterWorkMode,
  onShuffle,
  onResetFilters,
  onAutoApply,
  onAutoApplyAll,
  onToggleSave,
  onOpenCoverModal,
  onQuickFillPortal,
  onSwitchTab
}) {
  const showHero = currentTab === "find-jobs";
  const showAutoApplyAll = currentTab === "find-jobs" || currentTab === "recommended";

  return (
    <>
      {showHero && (
        <SearchHero
          keyword={keyword}
          setKeyword={setKeyword}
          location={location}
          setLocation={setLocation}
          onSearch={onSearch}
          onClearSearch={onClearSearch}
          filterExperience={filterExperience}
          setFilterExperience={setFilterExperience}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          filterWorkMode={filterWorkMode}
          setFilterWorkMode={setFilterWorkMode}
          onShuffle={onShuffle}
          onResetFilters={onResetFilters}
        />
      )}

      <main className="content-layout">
        
        {/* Left Column: Job Cards List */}
        <section className="jobs-list-panel">
          
          <div className="list-header-row">
            <div>
              <div className="results-count" id="resultsCountLabel">{resultsCountLabel}</div>
              <div className="search-meta" id="searchMetaLabel">{searchMetaLabel}</div>
            </div>

            {showAutoApplyAll && jobs.length > 0 && (
              <button
                className="btn-auto-apply"
                onClick={onAutoApplyAll}
                title="Automatically apply to all visible qualified listings"
              >
                <span>⚡ Auto-Apply All</span>
              </button>
            )}
          </div>

          <div id="jobCardsContainer">
            {loading ? (
              <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "36px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
                <div>Loading jobs...</div>
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>No jobs found</div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>
                  {currentTab === "applied"
                    ? "Applications you submit will appear here with verification receipts."
                    : currentTab === "saved"
                    ? "Bookmark opportunities you love to track them easily."
                    : "Try clearing filters to see recommended jobs."}
                </div>
                {currentTab === "find-jobs" && (
                  <button
                    className="filter-dropdown-btn"
                    onClick={onResetFilters}
                    style={{ marginTop: "14px", display: "inline-block" }}
                  >
                    Reset All Filters
                  </button>
                )}
                {(currentTab === "applied" || currentTab === "saved") && (
                  <button
                    className="btn-primary"
                    onClick={() => onSwitchTab("find-jobs")}
                    style={{ marginTop: "14px", padding: "8px 18px", fontSize: "13px" }}
                  >
                    Find Jobs Now
                  </button>
                )}
              </div>
            ) : (
              jobs.map(job => {
                const isSelected = selectedJob && (selectedJob.id === job.id);
                const isApplied = appliedJobs.some(a => a.job_id === job.id || a.application_id === job.id || a.link === job.link) || job.is_applied === true;
                const isSaved = savedJobs.some(s => s.id === job.id);

                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={isSelected}
                    isApplied={isApplied}
                    isSaved={isSaved}
                    onSelect={() => onSelectJob(job)}
                    onToggleSave={onToggleSave}
                  />
                );
              })
            )}
          </div>

        </section>

        {/* Right Column: Job Detail View */}
        <section className="job-detail-panel">
          {selectedJob ? (
            <JobDetail
              job={selectedJob}
              isApplied={appliedJobs.some(a => a.job_id === selectedJob.id || a.application_id === selectedJob.id || a.link === selectedJob.link) || selectedJob.is_applied === true}
              isSaved={savedJobs.some(s => s.id === selectedJob.id)}
              appRecord={appliedJobs.find(a => a.job_id === selectedJob.id || a.application_id === selectedJob.id || a.link === selectedJob.link) || null}
              candidate={candidate}
              onAutoApply={onAutoApply}
              onToggleSave={onToggleSave}
              onOpenCoverModal={onOpenCoverModal}
              onQuickFillPortal={onQuickFillPortal}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>No job selected</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Click a job card on the left to inspect qualifications and apply.</div>
            </div>
          )}
        </section>

      </main>
    </>
  );
}
