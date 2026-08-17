// Citizen Portal guided tours — static instructional content only.
// No business data, no API calls; the tour explains the actual UI.
//
// Each step may declare:
//   targets   – ordered selector fallbacks; the first visible match wins
//               (missing targets are skipped gracefully, never errors)
//   opensSidebar – auto-open the Explore Map sidebar before highlighting
//   click     – a selector clicked once before the target is expected to
//               appear (used only for the complaint wizard's real "Next"
//               button — a plain UI click, never an API call)

export const TOUR_VERSION = 1
export const TOUR_STORAGE_KEY = 'ndisp-citizen-tour-v1'

export const TOURS = [
  {
    id: 'main',
    label: 'Portal Overview',
    steps: [
      {
        id: 'dashboard',
        targets: ['[data-tour="citizen-dashboard"]'],
        title: 'Your Dashboard',
        description: 'Start here for an overview of your services, recent activity and important updates.',
      },
      {
        id: 'explore-map',
        targets: ['[data-tour="citizen-explore-map"]'],
        title: 'Find Facilities Near You',
        description: 'Use Explore Map to find nearby hospitals, schools, banks and other government facilities.',
      },
      {
        id: 'register-complaint',
        targets: ['[data-tour="citizen-register-complaint"]'],
        title: 'Report a Problem',
        description: 'Have a problem that needs attention? Use Register Complaint to report it to the concerned department.',
      },
      {
        id: 'my-complaints',
        targets: ['[data-tour="citizen-my-complaints"]'],
        title: 'My Complaints',
        description: 'See the complaints you have submitted and check their current status.',
      },
      {
        id: 'track-complaint',
        targets: ['[data-tour="citizen-track-complaint"]'],
        title: 'Track a Complaint',
        description: 'Use Track Complaint to check the progress of a complaint using its tracking number.',
      },
      {
        id: 'schemes',
        targets: ['[data-tour="citizen-schemes"]'],
        title: 'Government Schemes',
        description: 'Explore government schemes and see services that may be available to you.',
      },
      {
        id: 'profile',
        targets: ['[data-tour="citizen-profile"]'],
        title: 'Profile & Notifications',
        description: 'Keep your profile information updated and check notifications for important updates.',
      },
      {
        id: 'done',
        done: true,
        title: "You're all set! 🎉",
        description: 'You now know the main features of the Citizen Portal. Whenever you need help, use the Help button at the top.',
      },
    ],
  },
  {
    id: 'map',
    label: 'Explore Map',
    route: '/citizen/map',
    // Both routes render the same Explore Map feature.
    routes: ['/citizen/map', '/citizen/facilities'],
    steps: [
      {
        id: 'search',
        targets: ['[data-tour="citizen-map-search"]'],
        opensSidebar: true,
        title: 'Search for a Facility',
        description: 'Search for a service or facility, such as a hospital, school or bank.',
      },
      {
        id: 'radius',
        targets: ['[data-tour="citizen-map-radius"]'],
        opensSidebar: true,
        title: 'Choose Your Search Area',
        description: 'This option lets you choose how far from your location you want to search.',
      },
      {
        id: 'results',
        targets: ['[data-tour="citizen-map-results"]', '[data-tour="citizen-map-searchpanel"]'],
        opensSidebar: true,
        title: 'Search Results',
        description: 'Here you can see facilities found near your search.',
      },
      {
        id: 'show-route',
        targets: ['[data-tour="citizen-map-show-route"]', '[data-tour="citizen-map-searchpanel"]'],
        opensSidebar: true,
        title: 'Get Directions',
        description: 'Select "Show Route" on a facility to see the route from your location to it. The distance and estimated travel time appear on the route panel.',
      },
      {
        id: 'start-from-here',
        targets: ['[data-tour="citizen-map-start-route"]', '[data-tour="citizen-map-searchpanel"]'],
        opensSidebar: true,
        title: 'Start From a Facility',
        description: 'Use "Start From Here" when you want to use a facility as the starting point for your journey.',
      },
      {
        id: 'map',
        targets: ['[data-tour="citizen-map-canvas"]'],
        title: 'Explore the Map',
        description: 'Use the map to see where facilities are located.',
      },
      {
        id: 'map-tools',
        targets: ['[data-tour="citizen-map-tools"]'],
        title: 'Map Tools',
        description: 'These tools help you find your location, measure distance, view layers and adjust the map.',
      },
    ],
  },
  {
    id: 'complaint',
    label: 'Register Complaint',
    route: '/citizen/register',
    steps: [
      {
        id: 'category',
        targets: ['[data-tour="citizen-complaint-category"]'],
        title: 'Choose the Type of Problem',
        description: 'Select the service area and the issue you want to report.',
      },
      {
        id: 'description',
        targets: ['[data-tour="citizen-complaint-description"]'],
        title: 'Describe the Problem',
        description: 'Describe the problem in your own words so the concerned department understands it.',
      },
      {
        id: 'location',
        targets: ['[data-tour="citizen-complaint-location"]'],
        click: '[data-tour="citizen-complaint-next"]',
        title: 'Tell Us Where the Problem Is',
        description: 'Drop a pin on the map or use your device location to show where the problem is.',
      },
      {
        id: 'evidence',
        targets: ['[data-tour="citizen-complaint-evidence"]'],
        click: '[data-tour="citizen-complaint-next"]',
        title: 'Add Photos or Documents',
        description: 'Add photos or documents if they help explain the problem.',
      },
      {
        id: 'submit',
        targets: ['[data-tour="citizen-complaint-submit"]'],
        click: '[data-tour="citizen-complaint-next"]',
        title: 'Review and Submit',
        description: 'Review your information and submit the complaint when you are ready.',
      },
    ],
  },
  {
    id: 'my-complaints',
    label: 'My Complaints',
    route: '/citizen/complaints',
    steps: [
      {
        id: 'stats',
        targets: ['[data-tour="citizen-complaints-stats"]'],
        title: 'Your Complaints at a Glance',
        description: 'These cards show the current progress of the complaints you have submitted.',
      },
      {
        id: 'list',
        targets: ['[data-tour="citizen-complaints-list"]'],
        title: 'Check the Progress',
        description: 'Select a complaint to see more details. The label shows its current progress.',
      },
    ],
  },
  {
    id: 'track',
    label: 'Track Complaint',
    route: '/citizen/track',
    steps: [
      {
        id: 'input',
        targets: ['[data-tour="citizen-track-input"]'],
        title: 'Enter Your Tracking Number',
        description: 'Enter the tracking number you received after submitting your complaint.',
      },
      {
        id: 'button',
        targets: ['[data-tour="citizen-track-button"]'],
        title: 'Check the Progress',
        description: 'Press "Track" to see the latest progress of your complaint.',
      },
    ],
  },
  {
    id: 'schemes',
    label: 'Schemes',
    route: '/citizen/schemes',
    steps: [
      {
        id: 'heading',
        targets: ['[data-tour="citizen-schemes-page"]'],
        title: 'Government Schemes',
        description: 'Browse government schemes available through the portal.',
      },
      {
        id: 'list',
        targets: ['[data-tour="citizen-schemes-list"]', '[data-tour="citizen-schemes-page"]'],
        title: 'Find What Suits You',
        description: 'Use the filters to find schemes relevant to you, and open a scheme to see eligibility and other information.',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    route: '/citizen/profile',
    steps: [
      {
        id: 'heading',
        targets: ['[data-tour="citizen-dashboard-main"]'],
        title: 'Your Profile',
        description: 'Keep your contact and account information up to date. Your complaint summary is shown here too.',
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    route: '/citizen/notifications',
    steps: [
      {
        id: 'heading',
        targets: ['[data-tour="citizen-dashboard-main"]'],
        title: 'Notifications',
        description: 'Important updates about your complaints and services appear here, and in the bell icon at the top.',
      },
    ],
  },
]