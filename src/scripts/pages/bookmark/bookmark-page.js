import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter.js';
import Database from '../../data/database.js';
import Map from '../../utils/map';

export default class BookmarkPage {
  #map = null;

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
 
      <section class="container">
        <h1 class="section-title">Daftar Laporan Story Tersimpan</h1>
 
        <div class="reports-list__container">
          <div id="reports-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });

    await this.presenter.initialGalleryAndMap();
    await this.initialMap();
  }

  async initialMap() {
    this.showMapLoading();
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
    });
    this.hideMapLoading();
  }

  populateBookmarkedReports(message, reports) {
    if (reports.length <= 0) {
      this.populateBookmarkedReportsListEmpty();
      return;
    }

    const html = reports.reduce((accumulator, report) => {
      return accumulator.concat(
        generateReportItemTemplate({
          ...report,
          placeNameLocation: report.location?.placeName || 'Lokasi tidak diketahui',
          reporterName: report.reporter?.name || report.name || 'Anonim',
          isSaved: report.isSaved || true,
        }),
      );
    }, '');

    document.getElementById('reports-list').innerHTML = `
      <div class="reports-list">${html}</div>
    `;

    this.attachToggleSaveEventListeners();
  }

  attachToggleSaveEventListeners() {
    const toggleButtons = document.querySelectorAll('.report-item__toggle-save');
    toggleButtons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        const id = event.target.getAttribute('data-id');
        const report = await Database.getStoryById(id);

        if (report.isSaved) {
          await Database.deleteStory(id);
          event.target.textContent = 'Simpan Laporan';
          report.isSaved = false;
          alert('Laporan berhasil dihapus.');
        } else {
          await Database.putStory({ ...report, isSaved: true });
          event.target.textContent = 'Buang Laporan';
          report.isSaved = true;
          alert('Laporan berhasil disimpan.');
        }
      });
    });
  }

  populateBookmarkedReportsListEmpty() {
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateBookmarkedReportsError(message) {
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }

  showReportsListLoading() {
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideReportsListLoading() {
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }
}
