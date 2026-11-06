import React, { useState, useEffect, useRef } from 'react';

export default function SearchHero({
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
  onResetFilters
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isFiltered = filterExperience !== "all" || filterLocation !== "all" || filterWorkMode !== "all";

  const expLabels = {
    all: "Experience",
    fresher: "0–2 Yrs",
    mid: "3–5 Yrs",
    senior: "5+ Yrs"
  };

  const locLabels = {
    all: "Location",
    Hyderabad: "Hyderabad",
    Bengaluru: "Bengaluru",
    Remote: "Remote"
  };

  const modeLabels = {
    all: "Work Mode",
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site"
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <section className="search-hero" id="searchHeroSection" ref={containerRef}>
      <div className="search-container">
        
        {/* Compact Centered Search Bar */}
        <div className="search-box-wrap">
          <div className="search-field">
            <span className="field-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by job title, skills, or company"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="search-divider"></div>

          <div className="search-field search-field-loc">
            <span className="field-icon">📍</span>
            <input
              type="text"
              className="search-input"
              placeholder="City, state, or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {(keyword || location) && (
            <button
              className="btn-clear-search"
              onClick={onClearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}

          <button className="btn-search" onClick={onSearch}>
            Find Jobs
          </button>
        </div>

        {/* Minimal Filter Row */}
        <div className="filter-bar">
          <button
            className="filter-dropdown-btn filter-shuffle-btn"
            onClick={onShuffle}
            title="Shuffle job listings"
          >
            <span className="shuffle-icon">🔀</span> All Filters
          </button>

          {/* Experience Filter Dropdown */}
          <div className="dropdown-select-wrap">
            <button
              className={`filter-dropdown-btn ${filterExperience !== "all" ? "active" : ""}`}
              onClick={() => setOpenDropdown(openDropdown === "exp" ? null : "exp")}
            >
              <span>{expLabels[filterExperience] || "Experience"}</span>
              <span className="dropdown-chevron">▾</span>
            </button>
            {openDropdown === "exp" && (
              <div className="filter-menu show">
                <div
                  className={`filter-menu-item ${filterExperience === "all" ? "active" : ""}`}
                  onClick={() => { setFilterExperience("all"); setOpenDropdown(null); }}
                >
                  Any Experience
                </div>
                <div
                  className={`filter-menu-item ${filterExperience === "fresher" ? "active" : ""}`}
                  onClick={() => { setFilterExperience("fresher"); setOpenDropdown(null); }}
                >
                  Entry / 0–2 Years
                </div>
                <div
                  className={`filter-menu-item ${filterExperience === "mid" ? "active" : ""}`}
                  onClick={() => { setFilterExperience("mid"); setOpenDropdown(null); }}
                >
                  Mid / 3–5 Years
                </div>
                <div
                  className={`filter-menu-item ${filterExperience === "senior" ? "active" : ""}`}
                  onClick={() => { setFilterExperience("senior"); setOpenDropdown(null); }}
                >
                  Senior / 5+ Years
                </div>
              </div>
            )}
          </div>

          {/* Location Filter Dropdown */}
          <div className="dropdown-select-wrap">
            <button
              className={`filter-dropdown-btn ${filterLocation !== "all" ? "active" : ""}`}
              onClick={() => setOpenDropdown(openDropdown === "loc" ? null : "loc")}
            >
              <span>{locLabels[filterLocation] || "Location"}</span>
              <span className="dropdown-chevron">▾</span>
            </button>
            {openDropdown === "loc" && (
              <div className="filter-menu show">
                <div
                  className={`filter-menu-item ${filterLocation === "all" ? "active" : ""}`}
                  onClick={() => { setFilterLocation("all"); setOpenDropdown(null); }}
                >
                  All Locations
                </div>
                <div
                  className={`filter-menu-item ${filterLocation === "Hyderabad" ? "active" : ""}`}
                  onClick={() => { setFilterLocation("Hyderabad"); setOpenDropdown(null); }}
                >
                  Hyderabad
                </div>
                <div
                  className={`filter-menu-item ${filterLocation === "Bengaluru" ? "active" : ""}`}
                  onClick={() => { setFilterLocation("Bengaluru"); setOpenDropdown(null); }}
                >
                  Bengaluru
                </div>
                <div
                  className={`filter-menu-item ${filterLocation === "Remote" ? "active" : ""}`}
                  onClick={() => { setFilterLocation("Remote"); setOpenDropdown(null); }}
                >
                  Remote
                </div>
              </div>
            )}
          </div>

          {/* Work Mode Filter Dropdown */}
          <div className="dropdown-select-wrap">
            <button
              className={`filter-dropdown-btn ${filterWorkMode !== "all" ? "active" : ""}`}
              onClick={() => setOpenDropdown(openDropdown === "mode" ? null : "mode")}
            >
              <span>{modeLabels[filterWorkMode] || "Work Mode"}</span>
              <span className="dropdown-chevron">▾</span>
            </button>
            {openDropdown === "mode" && (
              <div className="filter-menu show">
                <div
                  className={`filter-menu-item ${filterWorkMode === "all" ? "active" : ""}`}
                  onClick={() => { setFilterWorkMode("all"); setOpenDropdown(null); }}
                >
                  All Modes
                </div>
                <div
                  className={`filter-menu-item ${filterWorkMode === "remote" ? "active" : ""}`}
                  onClick={() => { setFilterWorkMode("remote"); setOpenDropdown(null); }}
                >
                  Remote
                </div>
                <div
                  className={`filter-menu-item ${filterWorkMode === "hybrid" ? "active" : ""}`}
                  onClick={() => { setFilterWorkMode("hybrid"); setOpenDropdown(null); }}
                >
                  Hybrid
                </div>
                <div
                  className={`filter-menu-item ${filterWorkMode === "onsite" ? "active" : ""}`}
                  onClick={() => { setFilterWorkMode("onsite"); setOpenDropdown(null); }}
                >
                  On-site
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button className="filter-reset-link" onClick={onResetFilters}>
              ↺ Reset Filters
            </button>
          )}

        </div>
      </div>
    </section>
  );
}
