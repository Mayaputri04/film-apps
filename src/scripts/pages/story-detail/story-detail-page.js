import {
  generateCommentsListEmptyTemplate,
  generateCommentsListErrorTemplate,
  generateLoaderAbsoluteTemplate,
  generateRemoveReportButtonTemplate,
  generateReportCommentItemTemplate,
  generateReportDetailErrorTemplate,
  generateReportDetailTemplate,
  generateSaveReportButtonTemplate,
} from '../../templates';
import { createCarousel } from '../../utils';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api';
import Database from '../../data/database';

export default class StoryDetailPage {
  #presenter = null;
  #form = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="report-detail__container">
          <div id="report-detail" class="report-detail"></div>
          <div id="report-detail-loading-container"></div>
        </div>
      </section>
      
      <section class="container">
        <hr>
        <div class="report-detail_comments_container">
          <div class="report-detail_comments-form_container">
            <h2 class="report-detail_comments-form_title">Beri Tanggapan</h2>
            <form id="comments-list-form" class="report-detail_comments-form_form">
              <textarea name="body" placeholder="Beri tanggapan terkait laporan."></textarea>
              <div id="submit-button-container">
                <button class="btn" type="submit">Tanggapi</button>
              </div>
            </form>
          </div>
          <hr>
          <div class="report-detail_comments-list_container">
            <div id="report-detail-comments-list"></div>
            <div id="comments-list-loading-container"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new StoryDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: StoryAPI,
      dbModel: Database,
    });

    this.#setupForm();

    await this.#presenter.showStoryDetail();
    await this.#presenter.getAllStories();
  }

  showStoryDetailLoading() {
    const container = document.getElementById('report-detail-loading-container');
    container.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideStoryDetailLoading() {
    const container = document.getElementById('report-detail-loading-container');
    container.innerHTML = '';
  }

  showCommentsLoading() {
    const container = document.getElementById('comments-list-loading-container');
    container.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideCommentsLoading() {
    const container = document.getElementById('comments-list-loading-container');
    container.innerHTML = '';
  }

  showSubmitLoadingButton() {
    const submitButton = document.querySelector('#comments-list-form button');
    submitButton.setAttribute('disabled', 'true');
    submitButton.innerHTML = 'Mengirim...';
  }

  hideSubmitLoadingButton() {
    const submitButton = document.querySelector('#comments-list-form button');
    submitButton.removeAttribute('disabled');
    submitButton.innerHTML = 'Tanggapi';
  }

  showMapLoading() {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';
  }

  showStoriesLoading() {
    const container = document.getElementById('stories-container');
    container.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideStoriesLoading() {
    const container = document.getElementById('stories-container');
    container.innerHTML = '';
  }

  async populateStoryDetailAndInitialMap(message, story) {
    const latitude = parseFloat(story.lat);
    const longitude = parseFloat(story.lon);

    document.getElementById('report-detail').innerHTML = generateReportDetailTemplate({
      title: story.name,
      description: story.description,
      photoUrl: story.photoUrl,
      createdAt: story.createdAt,
      lat: story.lat,
      lon: story.lon,
      reporterName: story.name,
    });

    createCarousel(document.getElementById('images'));

    await this.#presenter.showStoryDetailMap();

    if (
      this.#map &&
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      const storyCoordinate = [latitude, longitude];
      const markerOptions = { alt: story.name };
      const popupOptions = { content: story.name };
      this.#map.changeCamera(storyCoordinate);
      this.#map.addMarker(storyCoordinate, markerOptions, popupOptions);
    } else {
      console.warn('Lokasi tidak valid atau tidak tersedia:', latitude, longitude);
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.innerHTML = '<p class="text-red-500">Lokasi tidak tersedia</p>';
      }
    }

    this.#presenter.showSaveButton();
    this.addNotifyMeEventListener();
  }

  populateStoryDetailError(message) {
    document.getElementById('report-detail').innerHTML = generateReportDetailErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', { zoom: 15 });
  }

  #setupForm() {
    this.#form = document.getElementById('comments-list-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        body: this.#form.elements.namedItem('body').value,
      };
      await this.#presenter.postNewComment(data);
    });
  }

  postNewCommentSuccessfully(message) {
    console.log(message);
    this.#presenter.getCommentsList();
    this.clearForm();
  }

  postNewCommentFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  renderSaveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateSaveReportButtonTemplate();
    document.getElementById('report-detail-save').addEventListener('click', async () => {
      alert('Laporan story berhasil disimpan!');
      await this.#presenter.saveStory();
      await this.#presenter.showSaveButton();
    });
  }

  saveToBookmarkSuccessfully(message) {
    console.log(message);
  }

  saveToBookmarkFailed(message) {
    alert(message);
  }

  renderRemoveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateRemoveReportButtonTemplate();

    document.getElementById('report-detail-remove').addEventListener('click', async () => {
      alert('Laporan story berhasil dihapus!');
      await this.#presenter.removeReport();
      await this.#presenter.showSaveButton();
    });
  }

  removeFromBookmarkSuccessfully(message) {
    console.log(message);
  }

  removeFromBookmarkFailed(message) {
    alert(message);
  }

  addNotifyMeEventListener() {
    document.getElementById('report-detail-notify-me').addEventListener('click', () => {
      alert('Fitur notifikasi akan segera hadir!');
    });
  }

  populateStories(stories) {
    if (!stories || stories.length === 0) {
      console.error('No stories available!');
      return;
    }

    const html = stories
      .map(
        (story) => `
      <div class="story-item">
        <h3>${story.title}</h3>
        <p>${story.description}</p>
      </div>
    `,
      )
      .join('');

    const container = document.getElementById('stories-container');
    if (container) {
      container.innerHTML = html;
    } else {
      console.error('Stories container not found!');
    }
  }

  populateStoriesError(message) {
    alert(message);
  }
}
