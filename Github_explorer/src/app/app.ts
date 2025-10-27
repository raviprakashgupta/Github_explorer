import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center">
      <div class="w-full max-w-6xl">
        
        <!-- Header -->
        <header class="text-center mb-8">
          <h1 class="text-4xl font-extrabold text-indigo-700">GitHub Repository Explorer</h1>
          <p class="text-gray-600 mt-2">Find public repositories, browse file systems, and view source code with AI insights.</p>
        </header>

        <!-- Search Type Selector (Segmented Control) - More Prominent -->
        <div class="flex justify-center mb-8" [hidden]="!!selectedRepo()">
          <div class="flex bg-white rounded-2xl p-2 shadow-xl border border-gray-200">
            <button
              (click)="setSearchType('user')"
              [class.bg-indigo-600]="searchType() === 'user'"
              [class.text-white]="searchType() === 'user'"
              [class.text-gray-700]="searchType() !== 'user'"
              class="type-button"
            >
              User
            </button>
            <button
              (click)="setSearchType('org')"
              [class.bg-indigo-600]="searchType() === 'org'"
              [class.text-white]="searchType() === 'org'"
              [class.text-gray-700]="searchType() !== 'org'"
              class="type-button"
            >
              Organization
            </button>
          </div>
        </div>

        <!-- Input Area and Button -->
        <ng-container *ngIf="!selectedRepo(); else repoView">
          <div class="bg-white p-6 shadow-xl rounded-2xl border border-gray-100 mb-8 flex flex-col sm:flex-row gap-4">
            <input
              #usernameInput
              (keyup.enter)="fetchRepos(usernameInput.value)"
              type="text"
              [placeholder]="inputPlaceholder()"
              class="flex-grow text-lg p-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition duration-150 outline-none font-inter"
              style="font-family: 'Inter', sans-serif;"
            />
            <button
              (click)="fetchRepos(usernameInput.value)"
              [disabled]="isLoading()"
              class="py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ng-container *ngIf="isLoading(); else fetchLabel">
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching...
                </span>
              </ng-container>
              <ng-template #fetchLabel>Fetch Repositories</ng-template>
            </button>
          </div>

          <!-- --- Dynamic Content Area (Loading/Error/List) --- -->

          <ng-container *ngIf="isLoading() && !selectedRepo(); else notLoadingRoot">
            <!-- Global Loading State -->
            <div class="text-center p-10 bg-white rounded-xl shadow-md w-full">
              <svg class="animate-spin h-8 w-8 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p class="mt-2 text-indigo-600 font-medium">Loading data...</p>
            </div>
          </ng-container>

          <ng-template #notLoadingRoot>
            <ng-container *ngIf="error(); else reposOrEmpty">
              <!-- Error Message -->
              <div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl">
                <p class="font-bold">Error:</p>
                <p>{{ error() }}</p>
                <button *ngIf="selectedRepo()" (click)="clearSelectedRepo()" class="mt-2 text-sm underline hover:text-red-800">Return to Repo List</button>
              </div>
            </ng-container>
          </ng-template>

          <ng-template #reposOrEmpty>
            <ng-container *ngIf="repos().length > 0; else emptyState">
              <!-- REPO LIST VIEW -->
              <h2 class="text-2xl font-semibold text-gray-800 mb-4">{{ username() }}'s {{ titleType() }} Repositories ({{ repos().length }})</h2>
              
              <div class="grid gap-4">
                <div *ngFor="let repo of repos(); trackBy: trackByRepoId" class="repo-card bg-white p-5 shadow-md rounded-xl border border-gray-200 transition hover:shadow-lg">
                  <!-- Clickable name to fetch contents -->
                  <button (click)="fetchRepoContents(repo)" class="text-xl font-bold text-indigo-600 hover:text-indigo-800 transition block mb-1 text-left w-full focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded-md -ml-1 pl-1">
                    {{ repo.name }}
                  </button>
                  <p class="text-gray-600 mt-1 mb-3 text-sm">
                    {{ repo.description || 'No description provided.' }}
                  </p>
                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span *ngIf="repo.language" class="flex items-center">
                      <svg class="w-4 h-4 mr-1 text-pink-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.316 3.123l2.404.962 4.07 10.174a1 1 0 01-.795 1.304l-.001.001h-16.143a1 1 0 01-.794-1.303l4.07-10.174 2.404-.962a2 2 0 011.666 0z" clip-rule="evenodd"></path></svg>
                      {{ repo.language }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.638-.921 1.94 0l1.724 5.312 5.584.406c.96.07.7 1.353 0 1.704l-4.26 3.098 1.625 5.166c.277.88.583 1.054-.343.454l-4.735-3.442-4.735 3.442c-.926.6-.62-.166-.343-.454l1.625-5.166-4.26-3.098c-.7-.351-.26-1.634.7-1.704l5.584-.406 1.724-5.312z"></path></svg>
                      {{ repo.stargazers_count }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm.707 11.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 10.586V7a1 1 0 112 0v3.586l2.293-2.293a1 1 0 011.414 1.414l-4 4z" clip-rule="evenodd"></path></svg>
                      {{ repo.forks_count }}
                    </span>
                  </div>
                </div>
              </div>
            </ng-container>
          </ng-template>

          <ng-template #emptyState>
            <!-- Empty State -->
            <div class="text-center p-10 bg-white rounded-xl shadow-md w-full">
              <svg class="mx-auto w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7h16M4 7l4 4m8-4l-4 4m0 0V5m0 2l-4 4m4-4l4 4"></path></svg>
              <h3 class="mt-2 text-lg font-medium text-gray-900">Ready to explore</h3>
              <p class="mt-1 text-sm text-gray-500">
                Select an account type and enter a name to see their public repositories.
              </p>
            </div>
          </ng-template>
        </ng-container>

        <!-- Repository selected view -->
        <ng-template #repoView>
          <ng-container *ngIf="selectedRepo()">
            <div class="bg-white p-6 shadow-xl rounded-2xl border border-gray-100 w-full">
              <!-- Back to Repo List Button & Title -->
              <button (click)="clearSelectedRepo()" class="text-indigo-600 hover:text-indigo-800 flex items-center mb-4 transition duration-150 p-2 -ml-2">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Repositories
              </button>

              <h2 class="text-xl font-bold text-gray-800 mb-4 truncate">{{ currentNavigationTitle() }}</h2>
              
              <div class="flex flex-col lg:flex-row gap-6">
                  <!-- LEFT COLUMN: File Explorer + Summary (35% width on desktop) -->
                  <div class="w-full lg:w-[35%] flex flex-col space-y-4">
                      
                      <!-- Summary Block -->
                      <div class="p-4 bg-indigo-50 rounded-xl border border-indigo-200 h-fit">
                          <h3 class="text-lg font-semibold text-indigo-800 mb-2">Repository Summary</h3>
                          <ng-container *ngIf="isSummarizing(); else summaryReady">
                              <div class="flex items-center text-indigo-600 text-sm">
                                  <svg class="animate-spin h-4 w-4 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  Analyzing README...
                              </div>
                          </ng-container>
                          <ng-template #summaryReady>
                            <p class="text-sm text-gray-700">{{ repoSummaryText() }}</p>
                          </ng-template>
                      </div>
                      
                      <!-- File Explorer (Directory Contents) -->
                      <div class="flex-grow p-4 bg-white border border-gray-200 rounded-xl shadow-inner overflow-y-auto" style="max-height: 60vh;">
                          <h3 class="text-lg font-semibold text-gray-800 mb-3">Directory Contents</h3>

                          <!-- Up Navigation Button -->
                          <button *ngIf="currentPath()" (click)="goUpDirectory()" class="text-gray-600 hover:text-gray-800 flex items-center mb-2 transition duration-150 p-2 -ml-2 text-sm font-mono file-item w-full text-left">
                            <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                            .. (Parent Directory)
                          </button>

                          <ng-container *ngIf="repoContents().length === 0 && !isLoading(); else contentsList">
                              <p class="text-gray-500 italic p-4 border rounded-xl bg-gray-50">This directory is empty.</p>
                          </ng-container>

                          <ng-template #contentsList>
                              <div class="space-y-1">
                                  <button *ngFor="let item of repoContents(); trackBy: trackByItemSha" (click)="handleContentClick(item)" class="file-item w-full text-left focus:outline-none focus:ring-1 focus:ring-indigo-300">
                                      <span class="mr-3">
                                          <!-- Folder icon -->
                                          <ng-container *ngIf="item.type === 'dir'; else fileIcon">
                                            <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H2V6z"></path><path d="M2 9v10h16V9H2z"></path></svg>
                                          </ng-container>
                                          <ng-template #fileIcon>
                                            <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 3.414L16.586 7A2 2 0 0118 8.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm6 0v4a1 1 0 001 1h4.586L10 4z" clip-rule="evenodd"></path></svg>
                                          </ng-template>
                                      </span>
                                      <span class="font-medium text-gray-800 transition truncate">{{ item.name }}</span>
                                  </button>
                              </div>
                          </ng-template>
                      </div>
                  </div>

                  <!-- RIGHT COLUMN: File Content / Code Conversion (65% width on desktop) -->
                  <div class="w-full lg:w-[65%]">
                      <ng-container *ngIf="fileContent(); else placeholderView">
                          <div class="p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-lg">
                              <h3 class="text-2xl font-bold text-gray-800 mb-4 truncate">{{ filePath() }}</h3>
                              
                              <!-- LLM Generated Explanation (Code Insight) -->
                              <ng-container *ngIf="codeExplanation()">
                                  <div class="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-xl">
                                      <h4 class="font-bold text-yellow-900 mb-1">Code Insight</h4>
                                      <ng-container *ngIf="codeExplanation() === 'Analyzing code content...'; else explanationReady">
                                        <span class="flex items-center text-sm">
                                            <svg class="animate-spin h-4 w-4 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            {{ codeExplanation() }}
                                        </span>
                                      </ng-container>
                                      <ng-template #explanationReady>
                                        <p class="text-sm">{{ codeExplanation() }}</p>
                                      </ng-template>
                                  </div>
                              </ng-container>

                              <!-- Code Conversion Tool -->
                              <ng-container *ngIf="isProgramFile()">
                                  <div class="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                      <span class="text-purple-800 font-semibold text-sm">
                                          Convert {{ sourceLanguage() }} to:
                                      </span>
                                      <div class="flex items-center gap-3 w-full md:w-auto">
                                          <select 
                                            #targetSelect
                                            (change)="targetLanguage.set(targetSelect.value)"
                                            [value]="targetLanguage()"
                                            class="p-2 border border-purple-300 rounded-lg text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                          >
                                            <option value="Python">Python</option>
                                            <option value="R">R</option>
                                            <option value="TypeScript">TypeScript</option>
                                            <option value="Go">Go</option>
                                            <option value="Java">Java</option>
                                          </select>
                                          <button
                                            (click)="convertCode()"
                                            [disabled]="isConverting()"
                                            class="py-2 px-4 bg-purple-600 text-white font-medium text-sm rounded-lg shadow-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 flex items-center"
                                          >
                                            <ng-container *ngIf="isConverting(); else convertLabel">
                                              <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                              Converting...
                                            </ng-container>
                                            <ng-template #convertLabel>Convert</ng-template>
                                          </button>
                                      </div>
                                  </div>
                              </ng-container>

                              <!-- Code Display (Side-by-Side if converted) -->
                              <div class="flex flex-col gap-4" [ngClass]="{'lg:flex-row': convertedCode()}">
                                  
                                  <!-- Original Code (Left/Top) -->
                                  <div [class]="convertedCode() ? 'lg:w-1/2 w-full' : 'w-full'"> 
                                      <h4 class="text-sm font-semibold text-gray-700 mb-1" [hidden]="!convertedCode()">Original ({{ sourceLanguage() }})</h4>
                                      <pre class="code-block" style="max-height: 50vh;">
                                        <code>{{ fileContent() }}</code>
                                      </pre>
                                  </div>

                                  <!-- Converted Code (Right/Bottom) -->
                                  <div *ngIf="convertedCode()" class="lg:w-1/2 w-full">
                                      <h4 class="text-sm font-semibold text-gray-700 mb-1">Converted ({{ targetLanguage() }}) - Editable</h4>
                                      <!-- Editable Text Area for Converted Code -->
                                      <textarea 
                                          [value]="convertedCode()"
                                          class="code-block w-full resize-y text-sm font-mono p-4 bg-gray-900 text-yellow-300"
                                          style="max-height: 50vh; min-height: 100px;"
                                          placeholder="Converted code will appear here..."
                                      ></textarea>
                                      <p class="text-xs text-gray-500 mt-2">You can edit this code and save it locally (Ctrl/Cmd+S).</p>
                                  </div>
                              </div>
                          </div>
                      </ng-container>

                      <ng-template #placeholderView>
                          <!-- Placeholder when no file is selected -->
                          <div class="flex items-center justify-center h-full p-10 text-gray-500 italic bg-gray-100 rounded-2xl border border-gray-200" style="min-height: 400px;">
                              <p class="text-center">
                                  <svg class="mx-auto w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1v-3.25m-7-3.64l4.24-4.24m-4.24 4.24l-4.24-4.24m4.24 4.24L9 12m0 0l-4 4m4-4l-4-4m4 4h7m-7 0a7 7 0 1014 0 7 7 0 00-14 0z"></path></svg>
                                  Select a file from the explorer on the left to view its contents, insights, and enable code conversion.
                              </p>
                          </div>
                      </ng-template>
                  </div>
              </div>
            </div>
          </ng-container>
        </ng-template>

      </div>
    </div>
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    :host {
      font-family: 'Inter', sans-serif;
    }
    .repo-card {
      min-height: 120px;
    }
    .type-button {
      /* Increased size/prominence */
      @apply px-6 py-3 text-base font-semibold rounded-xl transition duration-150 ease-in-out; 
    }
    .file-item {
      /* Base styles for the clickable file/folder button */
      @apply flex items-center p-3 rounded-xl transition duration-150 ease-in-out;
      @apply hover:bg-gray-100 border border-transparent hover:border-gray-200 cursor-pointer;
    }
    .code-block {
      @apply bg-gray-800 text-green-300 p-4 rounded-xl overflow-auto text-sm shadow-inner;
      white-space: pre; /* Ensure preformatted text wraps correctly in pre/code */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // --- Core State ---
  searchType = signal<'user' | 'org'>('user');
  username = signal('');
  repos = signal<any[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // --- Navigation & Content State ---
  selectedRepo = signal<any | null>(null); 
  currentPath = signal(''); 
  repoContents = signal<any[]>([]); 

  // --- AI States ---
  repoSummaryText = signal<string | null>(null); // Generated summary for the current repo
  isSummarizing = signal(false); // Loading state for the summary
  fileContent = signal<string | null>(null); // Raw content of the viewed file
  filePath = signal<string | null>(null); // Full path of the viewed file
  codeExplanation = signal<string | null>(null); // Generated explanation for the file content

  // --- New Conversion States ---
  convertedCode = signal<string | null>(null); 
  isConverting = signal(false);
  targetLanguage = signal<string>('Python'); // Default target
  sourceLanguage = signal<string>('Unknown'); // Inferred

  // --- Computed Properties ---
  inputPlaceholder = computed(() => 
    this.searchType() === 'user' ? 'e.g., angular, facebook, torvalds' : 'e.g., google, microsoft, TheOdinProject'
  );

  titleType = computed(() => 
    this.searchType() === 'user' ? 'User' : 'Organization'
  );

  currentNavigationTitle = computed(() => {
    const repo = this.selectedRepo();
    if (!repo) return '';
    const path = this.currentPath();
    const branch = repo.default_branch || 'main'; 
    
    if (path === '') return `${repo.name} / ${branch}`;
    return `${repo.name} / ${branch} / ${path}`;
  });

  // trackBy helpers for ngFor performance/stability
  trackByRepoId(index: number, repo: any) {
    return repo?.id ?? index;
  }

  trackByItemSha(index: number, item: any) {
    return item?.sha ?? item?.path ?? index;
  }

  // --- Utility Methods ---

  /**
   * Sets the type of entity to search for and resets the view.
   * @param type 'user' or 'org'
   */
  setSearchType(type: 'user' | 'org') {
    this.searchType.set(type);
    this.repos.set([]);
    this.error.set(null);
    this.clearSelectedRepo();
  }

  /**
   * Clears the selected repository and its contents to return to the list view.
   */
  clearSelectedRepo() {
    this.selectedRepo.set(null);
    this.currentPath.set('');
    this.repoContents.set([]);
    this.repoSummaryText.set(null);
    this.isSummarizing.set(false);
    this.clearFileContent();
    this.error.set(null);
  }

  /**
   * Clears the file content view to return to the directory list view.
   */
  clearFileContent() {
    this.fileContent.set(null);
    this.filePath.set(null);
    this.codeExplanation.set(null);
    this.convertedCode.set(null);
    this.isConverting.set(false);
    this.error.set(null);
  }

  /**
   * Navigates up one level in the current directory path.
   */
  goUpDirectory() {
    const currentPath = this.currentPath();
    const repo = this.selectedRepo();
    if (currentPath && repo) {
      this.clearFileContent();
      const parts = currentPath.split('/');
      parts.pop(); 
      const newPath = parts.join('/');
      
      this.fetchRepoContents(repo, newPath);
    }
  }

  /**
   * Handles click on a file or folder item in the directory list.
   * @param item The GitHub content item (file or directory).
   */
  handleContentClick(item: any) {
    this.clearFileContent();
    if (item.type === 'dir') {
      // Drill down into folder
      this.fetchRepoContents(this.selectedRepo(), item.path);
    } else if (item.type === 'file') {
      // View file content
      this.fetchFileContent(item);
    }
  }

  /** Checks if the current file is a known program file type for conversion. */
  isProgramFile(): boolean {
    const path = this.filePath();
    if (!path) return false;
    const extension = path.split('.').pop()?.toLowerCase() || '';
    // Includes common scripting and compilation languages
    return ['py', 'r', 'js', 'ts', 'java', 'cpp', 'c', 'go', 'php'].includes(extension);
  }

  /** Infers the source language from the file name. */
  inferSourceLanguage(fileName: string): void {
    const extensionMap: { [key: string]: string } = {
      'py': 'Python', 'r': 'R', 'js': 'JavaScript', 'ts': 'TypeScript', 'java': 'Java', 
      'cpp': 'C++', 'c': 'C', 'go': 'Go', 'php': 'PHP', 'rs': 'Rust', 'rb': 'Ruby', 'sh': 'Shell'
    };
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const lang = extensionMap[extension] || 'Unknown';
    this.sourceLanguage.set(lang);
  }


  // --- API Fetching Methods ---

  /**
   * Fetches repositories based on the selected type and name.
   */
  async fetchRepos(inputName: string): Promise<void> {
    const trimmedName = inputName.trim();
    this.clearSelectedRepo(); 

    if (!trimmedName) {
      this.error.set(`Please enter a valid GitHub ${this.searchType() === 'user' ? 'username' : 'organization name'}.`);
      this.repos.set([]);
      this.username.set('');
      return;
    }

    this.username.set(trimmedName);
    this.isLoading.set(true);
    this.error.set(null);
    this.repos.set([]);

    const endpoint = this.searchType() === 'user' ? 'users' : 'orgs';
    const url = 'https://api.github.com/' + endpoint + '/' + trimmedName + '/repos';

    try {
      const response = await this.retryFetch(url);

      if (response.status === 404) {
        throw new Error(`GitHub ${this.titleType()} "${trimmedName}" not found.`);
      }
      
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Failed to fetch repositories due to an API error.');
      }

      const data = await response.json();
      
      if (data.length === 0) {
        this.error.set(`${this.titleType()} "${trimmedName}" has no public repositories.`);
        return;
      }
      
      this.repos.set(data);

    } catch (e: any) {
      console.error("Fetch error:", e);
      this.error.set(e.message || "An unexpected error occurred while fetching data.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fetches the file and folder contents of a selected repository's branch/path.
   * Also triggers the README summary fetch if at the root.
   */
  async fetchRepoContents(repo: any, path: string = ''): Promise<void> {
    this.selectedRepo.set(repo); 
    this.currentPath.set(path); 
    this.repoContents.set([]);
    this.isLoading.set(true); 
    this.error.set(null);
    this.clearFileContent();

    const owner = repo.owner.login;
    const repoName = repo.name;
    
    // API endpoint for contents
    const url = 'https://api.github.com/repos/' + owner + '/' + repoName + '/contents/' + path;
    
    // 1. Fetch Summary if at Root
    if (path === '') {
        this.fetchAndSummarizeReadme(repo);
    }

    // 2. Fetch Directory Contents
    try {
      const response = await this.retryFetch(url);
      
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Failed to fetch repository contents.');
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        data.sort((a: any, b: any) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        this.repoContents.set(data);
      } else {
        this.repoContents.set([]);
      }

    } catch (e: any) {
      console.error("Content fetch error:", e);
      this.error.set(e.message || "An unexpected error occurred while fetching contents.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fetches the raw content of a specific file and triggers AI analysis.
   * @param file The GitHub content item for the file.
   */
  async fetchFileContent(file: any): Promise<void> {
    if (file.type !== 'file') return;

    this.fileContent.set(null);
    this.filePath.set(file.path);
    this.isLoading.set(true);
    this.error.set(null);
    this.codeExplanation.set(null);
    this.convertedCode.set(null);

    try {
      // Fetch file data (which includes base64 content)
      const response = await this.retryFetch(file.url); 
      
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Failed to fetch file content.');
      }

      const data = await response.json();
      
      let decodedContent = "Could not read file content.";
      if (data.encoding === 'base64' && data.content) {
        decodedContent = atob(data.content);
      } else if (data.content) {
        decodedContent = data.content; 
      }

      this.fileContent.set(decodedContent);
      this.inferSourceLanguage(file.name); // Infer language for conversion
      this.analyzeCodeContent(decodedContent, file.name); // Trigger AI analysis

    } catch (e: any) {
      console.error("File content fetch error:", e);
      this.error.set(e.message || "An unexpected error occurred while viewing file.");
      this.clearFileContent();
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Fetches the README and uses the LLM to generate a summary.
   */
  async fetchAndSummarizeReadme(repo: any): Promise<void> {
    this.isSummarizing.set(true);
    this.repoSummaryText.set('Analyzing repository...');
    this.error.set(null);

    const owner = repo.owner.login;
    const repoName = repo.name;
    
    // Attempt to fetch README content
    const readmeUrl = `https://api.github.com/repos/${owner}/${repoName}/readme`;

    try {
        const response = await this.retryFetch(readmeUrl);
        
        let readmeContent = '';
        if (response.ok) {
            const data = await response.json();
            if (data.encoding === 'base64' && data.content) {
                readmeContent = atob(data.content);
            }
        } 
        
        // Prepare LLM request
        const systemPrompt = "Act as a software architect. Provide a concise, single-paragraph summary (max 4 sentences) of the repository's core purpose, technologies, and features. Base your answer on the description and provided README content.";
        const userQuery = `Repository Description: ${repo.description || 'No description provided.'}. README Content (if available): \n\n${readmeContent || 'No README file found. Please rely solely on the description.'}`;

        const summary = await this.llmGenerate(userQuery, systemPrompt);
        this.repoSummaryText.set(summary.text);

    } catch (e: any) {
        console.error("Summary error:", e);
        this.repoSummaryText.set(repo.description || 'Could not generate detailed summary. The repository description is shown here.');
    } finally {
        this.isSummarizing.set(false);
    }
  }

  /**
   * Uses the LLM to analyze file content and generate an explanation.
   */
  async analyzeCodeContent(content: string, fileName: string): Promise<void> {
    this.codeExplanation.set('Analyzing code content...');
    this.error.set(null);

    try {
        const MAX_LLM_INPUT_LENGTH = 10000;
        const inputContent = content.length > MAX_LLM_INPUT_LENGTH ? 
                             content.substring(0, MAX_LLM_INPUT_LENGTH) + '\n\n[... content truncated for analysis.]' : 
                             content;
        
        const systemPrompt = "Act as a technical analyst. In one short, user-friendly paragraph (max 4 sentences), explain the primary function, key technologies/language, and importance of this file within a repository. Do not use markdown (e.g., code blocks or bolding) in the output.";
        const userQuery = `Analyze the file named "${fileName}" with the following content: \n\n${inputContent}`;

        const explanation = await this.llmGenerate(userQuery, systemPrompt);
        this.codeExplanation.set(explanation.text);

    } catch (e: any) {
        console.error("Code analysis error:", e);
        this.codeExplanation.set("Could not generate code analysis.");
    }
  }
  
  /** Uses the LLM to convert code content to another language. */
  async convertCode(): Promise<void> {
    const sourceCode = this.fileContent();
    const sourceLang = this.sourceLanguage();
    const targetLang = this.targetLanguage();
    
    if (!sourceCode || sourceLang === 'Unknown') return;

    this.isConverting.set(true);
    this.convertedCode.set('Converting code...');
    this.error.set(null);

    try {
        const MAX_LLM_INPUT_LENGTH = 15000;
        const inputContent = sourceCode.length > MAX_LLM_INPUT_LENGTH ? 
                             sourceCode.substring(0, MAX_LLM_INPUT_LENGTH) + '\n\n[... content truncated for conversion.]' : 
                             sourceCode;
        
        const systemPrompt = `You are a professional software engineer specializing in language translation. Convert the provided source code from ${sourceLang} to a functionally equivalent and idiomatic ${targetLang} program. Provide ONLY the runnable code in your response, do not include any explanatory text, markdown formatting (like code blocks, headings), or comments outside of the code itself.`;
        const userQuery = `Convert the following ${sourceLang} code to ${targetLang}:\n\n${inputContent}`;

        const converted = await this.llmGenerate(userQuery, systemPrompt);
        this.convertedCode.set(converted.text);

    } catch (e: any) {
        console.error("Code conversion error:", e);
        this.convertedCode.set("Error during code conversion. Please check console for details.");
    } finally {
        this.isConverting.set(false);
    }
  }


  // --- Helper Methods ---

  /**
   * Helper function to perform fetch with exponential backoff for resilience.
   */
  private async retryFetch(url: string, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (response.status !== 429) { // Not rate limited
          return response;
        }
        const delay = Math.pow(2, i) * 1000 + (Math.random() * 500); 
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        if (i === retries - 1) {
          throw error; 
        }
        const delay = Math.pow(2, i) * 1000 + (Math.random() * 500);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Maximum fetch retries exceeded.");
  }

  /**
   * Helper function to call the Gemini LLM API.
   */
  private async llmGenerate(userQuery: string, systemPrompt: string): Promise<{ text: string }> {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    let result: any = {};
    for (let i = 0; i < 3; i++) { 
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000 + Math.random() * 500));
                continue;
            }

            if (!response.ok) {
                throw new Error("LLM API call failed.");
            }

            result = await response.json();
            break; 

        } catch (error) {
            if (i === 2) throw error; 
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000 + Math.random() * 500));
        }
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI model.';
    return { text };
  }
}
