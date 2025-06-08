import { AppDataSource } from './config/data-source';
import { User, UserRole } from './entities/User';
import { Event, EventStatus } from './entities/Event';
import { Booking, BookingStatus } from './entities/Booking';
import { Ticket, TicketType, TicketStatus } from './entities/Ticket';
import { Payment } from './entities/Payment';
import { EventCategory } from './entities/EventCategory';
import { Venue } from './entities/Venue';
import bcryptjs from 'bcryptjs';
import { Seat, SeatStatus } from './entities/Seat';

// Mock event data based on frontend-public/src/mocks/events.js
const mockEvents = [
  {
    title: 'BestSelller Book Bootcamp – write, Market & Publish Your Book – Lucknow',
    imageUrl: 'event-0.png',
    type: 'ONLINE EVENT – Attend anywhere',
    isFree: false
  },
  {
    title: 'Woodcraft & Design Workshop – Art of Simplicity',
    imageUrl: 'event-1.png',
    type: 'IN-PERSON',
    isFree: true
  },
  {
    title: 'Photography for Beginners – Capture the Moment',
    imageUrl: 'event-2.jpg',
    type: 'ONLINE EVENT – Attend anywhere',
    isFree: false
  },
  {
    title: 'Live Music Concert – Downtown Beats',
    imageUrl: 'event-3.jpg',
    type: 'IN-PERSON',
    isFree: false
  },
  {
    title: 'Online Coding Bootcamp – Learn React in 1 Week',
    imageUrl: 'event-4.jpg',
    type: 'ONLINE EVENT – Attend anywhere',
    isFree: true
  },
  {
    title: 'Street Art & Graffiti Tour – Urban Expression',
    imageUrl: 'event-5.jpg',
    type: 'IN-PERSON',
    isFree: false
  },
  {
    title: 'Comedy Night Special – Laugh Out Loud',
    imageUrl: 'event-2.jpg',
    type: 'IN-PERSON',
    isFree: false
  },
  {
    title: 'DIY Pottery Workshop – Craft Your Own Mug',
    imageUrl: 'event-1.png',
    type: 'IN-PERSON',
    isFree: true
  },
  {
    title: 'Mindfulness & Meditation Session – Free Your Mind',
    imageUrl: 'event-5.jpg',
    type: 'ONLINE EVENT – Attend anywhere',
    isFree: true
  },
  {
    title: 'Foodie Tour – Taste of the Fringe',
    imageUrl: 'event-1.png',
    type: 'IN-PERSON',
    isFree: false
  },
  {
    title: 'Dance Workshop – Move with the Beat',
    imageUrl: 'event-4.jpg',
    type: 'ONLINE EVENT – Attend anywhere',
    isFree: true
  }
];

// Event descriptions for variety
const eventDescriptions = [
  "Join us for this exciting event featuring top industry professionals. Learn, network, and grow your skills in a supportive environment.",
  "An immersive experience designed to inspire creativity and innovation. Perfect for beginners and experts alike.",
  "Don't miss this opportunity to expand your horizons and connect with like-minded individuals in your field.",
  "A hands-on workshop where theory meets practice. Take home valuable skills you can apply immediately.",
  "Discover new perspectives and approaches in this engaging session led by renowned experts.",
  "A unique chance to explore cutting-edge developments and stay ahead of the curve in your industry.",
  "Relax and enjoy world-class entertainment while connecting with the community.",
  "Challenge yourself and push your boundaries in this transformative experience.",
  "Learn practical techniques and strategies you can implement right away for tangible results.",
  "An unforgettable experience that combines education, entertainment, and networking opportunities."
];

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  
  // Disable foreign key checks
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
  
  try {
    // Clear all tables using direct SQL
    await AppDataSource.query('TRUNCATE TABLE payment;');
    await AppDataSource.query('TRUNCATE TABLE ticket;');
    await AppDataSource.query('TRUNCATE TABLE booking;');
    await AppDataSource.query('TRUNCATE TABLE event;');
    await AppDataSource.query('TRUNCATE TABLE user;');
    await AppDataSource.query('TRUNCATE TABLE venue;');
    await AppDataSource.query('TRUNCATE TABLE event_category;');
    console.log('✅ Data cleared successfully');
  } finally {
    // Re-enable foreign key checks
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

async function seed() {
  await AppDataSource.initialize();
  
  // Clear existing data first
  await clearData();

  // 1. Create event categories
  const categories = [
    'Music', 'Arts & Culture', 'Business', 'Food & Drink', 
    'Health & Wellness', 'Technology', 'Education', 'Entertainment'
  ];
  
  const savedCategories = [];
  for (const categoryName of categories) {
    const category = new EventCategory();
    category.name = categoryName;
    await AppDataSource.getRepository(EventCategory).save(category);
    savedCategories.push(category);
  }

  // 2. Create venues
  const venueData = [
    { 
      name: 'Adelaide Festival Centre', 
      location: 'King William Rd, Adelaide SA 5000, Australia',
      imageUrl: 'https://images.unsplash.com/photo-1598945753867-1dce6eaf4b2d?q=80&w=1000&auto=format&fit=crop',
      capacity: 2000,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 20,
        columns: 30,
        rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
        sectionLayout: {
          'Orchestra': {
            startRow: 0,
            endRow: 9,
            startCol: 0,
            endCol: 29
          },
          'Mezzanine': {
            startRow: 10,
            endRow: 19,
            startCol: 0,
            endCol: 29
          }
        }
      }
    },
    { 
      name: 'Adelaide Convention Centre', 
      location: 'North Terrace, Adelaide SA 5000, Australia',
      imageUrl: 'https://media.istockphoto.com/id/1397427251/photo/adelaide-convention-centre.jpg?s=612x612&w=0&k=20&c=f9Cg7PV-vNIg9jCnV2TxdDKYRhOxVBOpnZcgBIl9XpM=',
      capacity: 3000,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 30,
        columns: 40,
        rowLabels: Array.from({ length: 30 }, (_, i) => String(i + 1)),
        sectionLayout: {
          'Main Hall': {
            startRow: 0,
            endRow: 19,
            startCol: 0,
            endCol: 39
          },
          'Balcony': {
            startRow: 20,
            endRow: 29,
            startCol: 10,
            endCol: 29
          }
        }
      }
    },
    { 
      name: 'The Garden of Unearthly Delights', 
      location: 'Rundle Park / Kadlitpina, East Terrace, Adelaide SA 5000',
      imageUrl: 'https://images.unsplash.com/photo-1598944999410-11a5a75daf49?q=80&w=1000&auto=format&fit=crop',
      capacity: 800,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 12,
        columns: 18,
        rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
        sectionLayout: {
          'Front': {
            startRow: 0,
            endRow: 5,
            startCol: 0,
            endCol: 17
          },
          'Back': {
            startRow: 6,
            endRow: 11,
            startCol: 0,
            endCol: 17
          }
        }
      }
    },
    { 
      name: 'Gluttony', 
      location: 'Rymill Park / Murlawirrapurka, Cnr East Tce & Rundle St, Adelaide SA 5000',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1000&auto=format&fit=crop',
      capacity: 500,
      hasAssignedSeating: false,
      seatingLayout: null
    },
    { 
      name: 'Adelaide Town Hall', 
      location: '128 King William St, Adelaide SA 5000, Australia',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Adelaide_Town_Hall_at_night.jpg/800px-Adelaide_Town_Hall_at_night.jpg',
      capacity: 1200,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 15,
        columns: 20,
        rowLabels: ['AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'JJ', 'KK', 'LL', 'MM', 'NN', 'PP', 'QQ'],
        sectionLayout: {
          'Stalls': {
            startRow: 0,
            endRow: 9,
            startCol: 0,
            endCol: 19
          },
          'Gallery': {
            startRow: 10,
            endRow: 14,
            startCol: 5,
            endCol: 14
          }
        }
      }
    }
  ];
  
  const venues = [];
  for (const data of venueData) {
    const venue = new Venue();
    venue.name = data.name;
    venue.location = data.location;
    venue.imageUrl = data.imageUrl;
    venue.capacity = data.capacity;
    venue.hasAssignedSeating = data.hasAssignedSeating;
    venue.seatingLayout = data.seatingLayout as any;
    await AppDataSource.getRepository(Venue).save(venue);
    venues.push(venue);
    
    // Create seats for venues with assigned seating
    if (venue.hasAssignedSeating && venue.seatingLayout) {
      console.log(`Creating seats for venue: ${venue.name}`);
      const seatRepository = AppDataSource.getRepository(Seat);
      const layout = venue.seatingLayout;
      const seats: Seat[] = [];
      
      // Create seats based on the seating layout
      for (let rowIdx = 0; rowIdx < layout.rows; rowIdx++) {
        const rowLabel = layout.rowLabels[rowIdx];
        for (let colIdx = 0; colIdx < layout.columns; colIdx++) {
          // Determine which section this seat belongs to
          let sectionName = '';
          for (const [section, bounds] of Object.entries(layout.sectionLayout)) {
            if (
              rowIdx >= bounds.startRow && 
              rowIdx <= bounds.endRow && 
              colIdx >= bounds.startCol && 
              colIdx <= bounds.endCol
            ) {
              sectionName = section;
              break;
            }
          }
          
          // Skip if not in any section
          if (!sectionName) continue;
          
          const seat = new Seat();
          seat.row = rowLabel;
          seat.seatNumber = (colIdx + 1).toString();
          seat.section = sectionName;
          seat.venue = venue;
          seat.status = SeatStatus.AVAILABLE;
          seat.price = 25.00; // Default price
          seat.type = 'standard';
          seat.isAccessible = false;
          
          // Make some seats wheelchair accessible
          if (colIdx === 0 && (rowIdx === 0 || rowIdx === layout.rows - 1)) {
            seat.isAccessible = true;
            seat.type = 'wheelchair';
          }
          
          // Make some seats VIP
          if (sectionName === 'Orchestra' || sectionName === 'Stalls') {
            if (rowIdx < 3 && colIdx >= Math.floor(layout.columns / 4) && colIdx < Math.floor(layout.columns * 3 / 4)) {
              seat.type = 'vip';
              seat.price = 50.00;
            }
          }
          
          seats.push(seat);
        }
      }
      
      // Save seats in batches
      if (seats.length > 0) {
        await seatRepository.save(seats);
        console.log(`Created ${seats.length} seats for venue: ${venue.name}`);
      }
    }
  }

  // 3. Create users
  const users: User[] = [];
  for (let i = 0; i < 30; i++) {
    const user = new User();
    user.email = `user${i}@test.com`;
    user.password = await bcryptjs.hash('password', 10); // Hash the password
    user.role = i < 3 ? UserRole.ADMIN : UserRole.USER;
    user.name = `User${i}`;
    user.isActive = true;
    users.push(user);
  }
  await AppDataSource.getRepository(User).save(users);

  // 4. Create events based on mock data
  const events: Event[] = [];
  
  // Calculate next Saturday
  const today = new Date();
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
  nextSaturday.setHours(9, 0, 0, 0); // 9 AM
  
  for (let i = 0; i < 50; i++) {
    // Get mock data with rotation
    const mockIndex = i % mockEvents.length;
    const mockEvent = mockEvents[mockIndex];
    
    const event = new Event();
    event.name = mockEvent.title;
    
    // Select a random description
    event.description = eventDescriptions[Math.floor(Math.random() * eventDescriptions.length)];
    
    // Assign a random organizer from users
    event.organizer = users[Math.floor(Math.random() * users.length)];
    
    // Assign a random category
    event.category = savedCategories[Math.floor(Math.random() * savedCategories.length)];
    
    // Assign a random venue
    event.venue = venues[Math.floor(Math.random() * venues.length)];
    
    // Set event dates - starting from next Saturday, each event 1-3 days apart
    const eventDate = new Date(nextSaturday);
    eventDate.setDate(nextSaturday.getDate() + i * (1 + Math.floor(Math.random() * 3)));
    
    // Random start time between 9 AM and 7 PM
    const startHour = 9 + Math.floor(Math.random() * 10);
    eventDate.setHours(startHour, 0, 0, 0);
    event.startTime = new Date(eventDate);
    
    // Event duration between 1-4 hours
    const durationHours = 1 + Math.floor(Math.random() * 4);
    const endTime = new Date(eventDate);
    endTime.setHours(startHour + durationHours);
    event.endTime = endTime;
    
    event.isActive = true;
    
    // Set capacity based on venue and event type
    const baseCapacity = mockEvent.type.includes('ONLINE') ? 500 : 100;
    event.totalCapacity = baseCapacity;
    event.availableCapacity = event.totalCapacity;
    
    // Set price based on whether it's free and randomize for paid events
    event.basePrice = mockEvent.isFree ? 0 : 20 + Math.floor(Math.random() * 80);
    
    // Set image URL
    event.imageUrl = mockEvent.imageUrl;
    
    // Additional fields
    event.hasSeatingPlan = !mockEvent.type.includes('ONLINE');
    event.isSoldOut = false;
    event.totalRevenue = 0;
    event.totalBookings = 0;
    
    // Set event status
    event.status = EventStatus.UPCOMING;
    
    // Add custom seating plan for in-person events with seating
    if (event.hasSeatingPlan) {
      event.seatingPlan = {
        rows: 10,
        columns: 10,
        sections: [
          {
            name: 'Main',
            rows: Array.from({ length: 5 }, (_, rowIndex) => ({
              rowNumber: rowIndex + 1,
              seats: Array.from({ length: 10 }, (_, seatIndex) => ({
                seatNumber: `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`,
                type: 'standard',
                price: event.basePrice,
                isAvailable: true
              }))
            }))
          },
          {
            name: 'VIP',
            rows: Array.from({ length: 2 }, (_, rowIndex) => ({
              rowNumber: rowIndex + 1,
              seats: Array.from({ length: 5 }, (_, seatIndex) => ({
                seatNumber: `VIP-${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`,
                type: 'vip',
                price: event.basePrice * 1.5,
                isAvailable: true
              }))
            }))
          }
        ]
      };
    }
    
    events.push(event);
  }
  await AppDataSource.getRepository(Event).save(events);

  // 5. Create some bookings
  const bookings: Booking[] = [];
  for (let i = 0; i < 40; i++) {
    const booking = new Booking();
    booking.user = users[i % users.length];
    booking.event = events[i % events.length];
    booking.status = BookingStatus.CONFIRMED;
    booking.totalAmount = events[i % events.length].basePrice;
    booking.paymentStatus = 'PAID';
    bookings.push(booking);
    
    // Update event stats
    const event = events[i % events.length];
    event.totalBookings += 1;
    event.totalRevenue += booking.totalAmount;
    event.availableCapacity -= 1;
  }
  await AppDataSource.getRepository(Booking).save(bookings);
  await AppDataSource.getRepository(Event).save(events);

  // 6. Create tickets
  const tickets: Ticket[] = [];
  for (let i = 0; i < 80; i++) {
    const ticket = new Ticket();
    ticket.user = users[i % users.length];
    ticket.event = events[i % events.length];
    ticket.type = i % 2 === 0 ? TicketType.REGULAR : TicketType.VIP;
    ticket.booking = bookings[i % bookings.length];
    ticket.price = ticket.type === TicketType.VIP ? 
      events[i % events.length].basePrice * 1.5 : 
      events[i % events.length].basePrice;
    ticket.status = TicketStatus.VALID;
    ticket.qrCode = `QR${i}${Date.now()}`;
    ticket.isScanned = false;
    ticket.isRefunded = false;
    tickets.push(ticket);
  }
  await AppDataSource.getRepository(Ticket).save(tickets);

  // 7. Create payments
  const payments: Payment[] = [];
  for (let i = 0; i < 30; i++) {
    const payment = new Payment();
    payment.user = users[i % users.length];
    payment.ticket = tickets[i % tickets.length];
    payment.method = ['Credit Card', 'PayPal', 'Bank Transfer'][i % 3];
    payment.amount = tickets[i % tickets.length].price;
    payment.status = 'Success';
    payment.transactionId = `TXN${i}${Date.now()}`;
    payment.timestamp = new Date();
    payments.push(payment);
  }
  await AppDataSource.getRepository(Payment).save(payments);

  console.log('✅ Seeder finished! Created:');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${venues.length} venues`);
  console.log(`   - ${events.length} events`);
  console.log(`   - ${bookings.length} bookings`);
  console.log(`   - ${tickets.length} tickets`);
  console.log(`   - ${payments.length} payments`);
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
}); 