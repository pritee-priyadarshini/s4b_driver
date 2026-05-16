import { HistoryOrder } from '../types/history';
const parseDateTime = (
    date: string,
    time: string
) => {

    const months: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
    };

    const [day, month, year] = date.split(' ');

    const cleanYear = Number(year);

    const [timePart, modifier] = time.split(' ');

    let [hours, minutes] = timePart
        .split(':')
        .map(Number);

    if (
        modifier === 'PM' &&
        hours !== 12
    ) {
        hours += 12;
    }

    if (
        modifier === 'AM' &&
        hours === 12
    ) {
        hours = 0;
    }

    return new Date(
        cleanYear,
        months[month],
        Number(day),
        hours,
        minutes
    ).getTime();
};

export const historyMock: HistoryOrder[] = [
    {
        id: '1',
        orderId: 'S4B-1024',
        status: 'Delivered',
        assignedDate: '12 Apr 2026',
        assignedTime: '02:00 PM',
        deliveredDate: '12 Apr 2026',
        deliveredTime: '04:10 PM',
        restaurant: {
            name: 'Pizza Hut',
            address: 'MG Road, Bangalore',
        },
        charity: {
            name: 'Feeding Hands Foundation',
            address: 'Indiranagar, Bangalore',
        },
        items: [
            {
                name: 'Bread',
                qty: 5,
            },
            {
                name: 'Rice',
                qty: 10,
            },
        ],
        driverRating: 4,
        restaurantRating: 5,
    },

    {
        id: '2',
        orderId: 'S4B-1025',
        status: 'Assigned',
        assignedDate: '13 Apr 2026',
        assignedTime: '11:30 AM',
        deliveredDate: '-',
        deliveredTime: '-',
        restaurant: {
            name: 'Red Dragon',
            address: 'Marathahalli, Bangalore',
        },

        charity: {
            name: 'Helping Souls NGO',
            address: 'Whitefield, Bangalore',
        },

        items: [
            {
                name: 'Cooked Food',
                qty: 15,
            },
        ],
        driverRating: 0,
        restaurantRating: 0,
    },
];