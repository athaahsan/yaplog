function FilterPopover({
  favoritedOnly,
  locationOptions,
  moodOptions,
  onClearFilters,
  onFavoritedOnlyChange,
  onToggleLocation,
  onToggleMood,
  selectedLocations,
  selectedMoods,
}) {
  return (
    <div className="filter-popover" role="dialog" aria-label="Journal filters">
      <div className="filter-popover-header">
        <span>Filters</span>
        <button className="text-button" type="button" onClick={onClearFilters}>
          Clear
        </button>
      </div>

      <section className="filter-section" aria-labelledby="mood-filter-heading">
        <h2 id="mood-filter-heading">Mood</h2>
        <div className="mood-filter-grid">
          {moodOptions.map((mood) => (
            <button
              className="emoji-filter"
              type="button"
              aria-pressed={selectedMoods.includes(mood)}
              data-active={selectedMoods.includes(mood)}
              key={mood}
              onClick={() => onToggleMood(mood)}
            >
              {mood}
            </button>
          ))}
        </div>
      </section>

      <section className="filter-section" aria-labelledby="location-filter-heading">
        <h2 id="location-filter-heading">Location</h2>
        <div className="filter-check-list">
          {locationOptions.map((location) => (
            <label className="filter-check" key={location}>
              <input
                type="checkbox"
                checked={selectedLocations.includes(location)}
                onChange={() => onToggleLocation(location)}
              />
              <span>{location}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="filter-section" aria-labelledby="favorite-filter-heading">
        <h2 id="favorite-filter-heading">Favorite</h2>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={favoritedOnly}
            onChange={(event) => onFavoritedOnlyChange(event.target.checked)}
          />
          <span>Favorited only</span>
        </label>
      </section>
    </div>
  )
}

export default FilterPopover
