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
import { Not, IsNull } from 'typeorm';

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
    await AppDataSource.query('TRUNCATE TABLE seat;');
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

// 将seed函数导出，使其可以在其他文件中使用
export async function seed() {
  // 检查数据源是否已初始化
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('Database initialized for seeding');
    } catch (error) {
      console.error('Failed to initialize database for seeding:', error);
      throw error;
    }
  }
  
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
      capacity: 120, // 10×12 = 120个座位
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 10,
        columns: 12,
        rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
        sectionLayout: {
          'Orchestra': {
            startRow: 0,
            endRow: 4,
            startCol: 0,
            endCol: 11
          },
          'Mezzanine': {
            startRow: 5,
            endRow: 9,
            startCol: 0,
            endCol: 11
          }
        }
      }
    },
    { 
      name: 'Adelaide Convention Centre', 
      location: 'North Terrace, Adelaide SA 5000, Australia',
      imageUrl: 'https://media.istockphoto.com/id/1397427251/photo/adelaide-convention-centre.jpg?s=612x612&w=0&k=20&c=f9Cg7PV-vNIg9jCnV2TxdDKYRhOxVBOpnZcgBIl9XpM=',
      capacity: 120,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 10,
        columns: 12,
        rowLabels: Array.from({ length: 10 }, (_, i) => String(i + 1)),
        sectionLayout: {
          'Main Hall': {
            startRow: 0,
            endRow: 5,
            startCol: 0,
            endCol: 11
          },
          'Balcony': {
            startRow: 6,
            endRow: 9,
            startCol: 2,
            endCol: 9
          }
        }
      }
    },
    { 
      name: 'The Garden of Unearthly Delights', 
      location: 'Rundle Park / Kadlitpina, East Terrace, Adelaide SA 5000',
      imageUrl: 'https://images.unsplash.com/photo-1598944999410-11a5a75daf49?q=80&w=1000&auto=format&fit=crop',
      capacity: 120,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 10,
        columns: 12,
        rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
        sectionLayout: {
          'Front': {
            startRow: 0,
            endRow: 4,
            startCol: 0,
            endCol: 11
          },
          'Back': {
            startRow: 5,
            endRow: 9,
            startCol: 0,
            endCol: 11
          }
        }
      }
    },
    { 
      name: 'Gluttony', 
      location: 'Rymill Park / Murlawirrapurka, Cnr East Tce & Rundle St, Adelaide SA 5000',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1000&auto=format&fit=crop',
      capacity: 120,
      hasAssignedSeating: false,
      seatingLayout: null
    },
    { 
      name: 'Adelaide Town Hall', 
      location: '128 King William St, Adelaide SA 5000, Australia',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Adelaide_Town_Hall_at_night.jpg/800px-Adelaide_Town_Hall_at_night.jpg',
      capacity: 120,
      hasAssignedSeating: true,
      seatingLayout: {
        rows: 10,
        columns: 12,
        rowLabels: ['AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'JJ', 'KK'],
        sectionLayout: {
          'Stalls': {
            startRow: 0,
            endRow: 5,
            startCol: 0,
            endCol: 11
          },
          'Gallery': {
            startRow: 6,
            endRow: 9,
            startCol: 2,
            endCol: 9
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
      
      // 确保使用固定的10×12布局
      const rowCount = 10;
      const colCount = 12;
      
      // Create seats based on the seating layout
      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        const rowLabel = layout.rowLabels[rowIdx];
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
          const colNumber = colIdx + 1;
          
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
          seat.seatNumber = colNumber.toString();
          seat.section = sectionName;
          seat.venue = venue;
          seat.status = SeatStatus.AVAILABLE;
          seat.price = 25.00; // Default price
          seat.type = 'standard';
          seat.isAccessible = false;
          
          // Make some seats wheelchair accessible
          if ((colIdx === 0 || colIdx === colCount - 1) && (rowIdx === 0 || rowIdx === rowCount - 1)) {
            seat.isAccessible = true;
            seat.type = 'wheelchair';
          }
          
          // Make some seats VIP
          if (rowIdx < 2 && colIdx >= 3 && colIdx <= 8) {
            seat.type = 'vip';
            seat.price = 50.00;
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

  // 创建事件座位数据
  console.log('Creating event seats...');
  for (const event of events) {
    // 只为有座位计划且场馆有座位布局的事件创建座位
    if (event.hasSeatingPlan && event.venue.hasAssignedSeating && event.venue.seatingLayout) {
      console.log(`Creating seats for event: ${event.name} at venue: ${event.venue.name}`);
      
      // 固定的10×12布局
      const rowCount = 10;
      const colCount = 12;
      const rowLabels = event.venue.seatingLayout.rowLabels.slice(0, rowCount);
      
      // 为事件创建座位
      const eventSeats: Seat[] = [];
      
      // 先获取该场馆的所有座位
      const venueSeats = await AppDataSource.getRepository(Seat).find({
        where: { 
          venue: { id: event.venue.id },
          event: { id: IsNull() } 
        }
      });
      
      // 创建场馆座位的映射，方便快速查找
      const venueSeatMap = new Map();
      venueSeats.forEach(seat => {
        const key = `${seat.row}-${seat.seatNumber}`;
        venueSeatMap.set(key, seat);
      });
      
      console.log(`Found ${venueSeats.length} venue seats for mapping to event`);
      
      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        const rowLabel = rowLabels[rowIdx];
        
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
          const colNumber = colIdx + 1;
          const seatNumberStr = colNumber.toString();
          
          // 确定座位所在的区域
          let sectionName = '';
          for (const [section, bounds] of Object.entries(event.venue.seatingLayout.sectionLayout)) {
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
          
          // 如果不在任何区域内，跳过
          if (!sectionName) continue;
          
          // 检查该座位是否已存在于场馆中
          const seatKey = `${rowLabel}-${seatNumberStr}`;
          const existingVenueSeat = venueSeatMap.get(seatKey);
          
          const eventSeat = new Seat();
          
          if (existingVenueSeat) {
            // 如果场馆中存在该座位，复制其属性
            eventSeat.row = existingVenueSeat.row;
            eventSeat.seatNumber = existingVenueSeat.seatNumber;
            eventSeat.section = existingVenueSeat.section;
            eventSeat.venue = event.venue;
            eventSeat.event = event;
            eventSeat.status = SeatStatus.AVAILABLE;
            eventSeat.type = existingVenueSeat.type;
            eventSeat.price = existingVenueSeat.type === 'vip' ? 
              event.basePrice * 1.5 : 
              (existingVenueSeat.type === 'wheelchair' ? event.basePrice * 0.8 : event.basePrice);
            eventSeat.isAccessible = existingVenueSeat.isAccessible;
            console.log(`Mapping venue seat ${seatKey} to event`);
          } else {
            // 如果场馆中不存在该座位，创建一个新的座位
            console.log(`Creating new seat ${seatKey} for event (not found in venue)`);
            eventSeat.row = rowLabel;
            eventSeat.seatNumber = seatNumberStr;
            eventSeat.section = sectionName;
            eventSeat.venue = event.venue;
            eventSeat.event = event;
            eventSeat.status = SeatStatus.AVAILABLE;
            
            // 设置座位类型和价格
            if (rowIdx < 2 && colIdx >= 3 && colIdx <= 8) {
              // VIP座位
              eventSeat.type = 'vip';
              eventSeat.price = event.basePrice * 1.5;
            } else if ((colIdx === 0 || colIdx === colCount - 1) && (rowIdx === 0 || rowIdx === rowCount - 1)) {
              // 轮椅座位
              eventSeat.type = 'wheelchair';
              eventSeat.price = event.basePrice * 0.8;
              eventSeat.isAccessible = true;
            } else {
              // 标准座位
              eventSeat.type = 'standard';
              eventSeat.price = event.basePrice;
              eventSeat.isAccessible = false;
            }
            
            // 同时创建场馆座位（如果不存在）
            const venueSeat = new Seat();
            venueSeat.row = rowLabel;
            venueSeat.seatNumber = seatNumberStr;
            venueSeat.section = sectionName;
            venueSeat.venue = event.venue;
            venueSeat.status = SeatStatus.AVAILABLE;
            venueSeat.type = eventSeat.type;
            venueSeat.price = eventSeat.price;
            venueSeat.isAccessible = eventSeat.isAccessible;
            
            await AppDataSource.getRepository(Seat).save(venueSeat);
            console.log(`Created new venue seat ${seatKey}`);
          }
          
          eventSeats.push(eventSeat);
        }
      }
      
      // 保存事件座位
      if (eventSeats.length > 0) {
        // 分批保存以避免内存问题
        const batchSize = 100;
        for (let i = 0; i < eventSeats.length; i += batchSize) {
          const batch = eventSeats.slice(i, i + batchSize);
          await AppDataSource.getRepository(Seat).save(batch);
        }
        console.log(`Created ${eventSeats.length} seats for event: ${event.name}`);
      }
    }
  }

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

  // 获取座位总数
  const totalSeats = await AppDataSource.getRepository(Seat).count();
  const eventSeats = await AppDataSource.getRepository(Seat).count({
    where: { event: { id: Not(IsNull()) } }
  });
  const venueSeats = await AppDataSource.getRepository(Seat).count({
    where: { event: { id: IsNull() } }
  });

  console.log('✅ Seeder finished! Created:');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${venues.length} venues`);
  console.log(`   - ${events.length} events`);
  console.log(`   - ${totalSeats} total seats (${venueSeats} venue seats, ${eventSeats} event seats)`);
  console.log(`   - ${bookings.length} bookings`);
  console.log(`   - 0 tickets`);
  console.log(`   - 0 payments`);
}

// 如果直接运行此文件，则执行seed函数
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed successfully');
    })
    .catch(error => {
      console.error('Error during seeding:', error);
    });
} 