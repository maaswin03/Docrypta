import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Video, Stethoscope, Star, MapPin, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  location: string;
  languages: string[];
  available: boolean;
  image: string;
}

export default function DoctorConnect() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const specialties = [
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "General Medicine"
  ];

  const doctors: Doctor[] = [
    {
      id: "1",
      name: "Dr. Ananya Sharma",
      specialty: "Cardiology",
      rating: 4.9,
      experience: 12,
      location: "Delhi",
      languages: ["Hindi", "English"],
      available: true,
      image: "/doctor1.jpg"
    },
    {
      id: "2",
      name: "Dr. Rajesh Patel",
      specialty: "Neurology",
      rating: 4.7,
      experience: 15,
      location: "Mumbai",
      languages: ["Hindi", "English", "Gujarati"],
      available: true,
      image: "/doctor2.jpg"
    },
    {
      id: "3",
      name: "Dr. Priya Menon",
      specialty: "Pediatrics",
      rating: 4.8,
      experience: 8,
      location: "Bangalore",
      languages: ["English", "Kannada", "Tamil"],
      available: false,
      image: "/doctor3.jpg"
    },
    {
      id: "4",
      name: "Dr. Amit Singh",
      specialty: "Orthopedics",
      rating: 4.6,
      experience: 10,
      location: "Hyderabad",
      languages: ["Hindi", "English", "Telugu"],
      available: true,
      image: "/doctor4.jpg"
    },
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="/doctorconnect"
                    className="hover:text-primary"
                  >
                    Health Services
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    Doctor Connect
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Connect with Doctors</h1>
            <p className="text-muted-foreground">
              Book video consultations with certified healthcare professionals
            </p>
          </div>

          <Tabs defaultValue="browse">
            <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
              <TabsTrigger value="browse">Browse Doctors</TabsTrigger>
              <TabsTrigger value="appointments">My Appointments</TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              <div className="grid gap-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search doctors by name or specialty..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {specialties.map((spec) => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDoctor ? (
                  <DoctorDetailCard 
                    doctor={selectedDoctor} 
                    onBack={() => setSelectedDoctor(null)}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDoctors.map((doctor) => (
                      <DoctorCard 
                        key={doctor.id} 
                        doctor={doctor}
                        onSelect={() => setSelectedDoctor(doctor)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <UpcomingAppointments />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DoctorCard({ doctor, onSelect }: { doctor: Doctor; onSelect: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="object-cover h-full w-full"
            />
          </div>
          <div>
            <CardTitle className="text-lg">{doctor.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{doctor.rating}</span>
          <span className="text-sm text-muted-foreground">
            ({doctor.experience}+ years)
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{doctor.location}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {doctor.languages.map((lang) => (
            <span key={lang} className="text-xs bg-muted px-2 py-1 rounded">
              {lang}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={doctor.available ? "default" : "secondary"} 
          className="w-full"
          disabled={!doctor.available}
        >
          {doctor.available ? "Book Appointment" : "Not Available"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function DoctorDetailCard({ doctor, onBack }: { doctor: Doctor; onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const availableDates = [
    "Today, May 15",
    "Tomorrow, May 16",
    "Friday, May 17",
    "Saturday, May 18"
  ];

  const availableTimes = [
    "9:00 AM", "10:30 AM", "12:00 PM", 
    "2:00 PM", "3:30 PM", "5:00 PM"
  ];

  return (
    <Card>
      <CardHeader>
        <Button variant="ghost" className="w-fit" onClick={onBack}>
          ← Back to doctors
        </Button>
        <div className="flex items-start gap-6 pt-4">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="object-cover h-full w-full"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">{doctor.name}</CardTitle>
            <p className="text-lg text-primary">{doctor.specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{doctor.rating}</span>
              <span className="text-muted-foreground">
                ({doctor.experience} years experience)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-medium">About Dr. {doctor.name.split(" ")[1]}</h3>
          <p className="text-muted-foreground">
            Board-certified {doctor.specialty} specialist with {doctor.experience} years of clinical experience. 
            Completed MD from AIIMS Delhi and fellowship in Advanced Cardiology Procedures.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Practicing at Apollo Hospitals, {doctor.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span>Specializes in: Heart Disease, Hypertension, ECG Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span>Video consultation fee: ₹800</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Book Appointment</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Select Date</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Choose a date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Time</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4" disabled={!selectedDate || !selectedTime}>
              Confirm Appointment (₹800)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingAppointments() {
  const appointments = [
    {
      id: "1",
      doctorName: "Dr. Ananya Sharma",
      specialty: "Cardiology",
      date: "Today, May 15",
      time: "3:30 PM",
      status: "confirmed"
    },
    {
      id: "2",
      doctorName: "Dr. Rajesh Patel",
      specialty: "Neurology",
      date: "Friday, May 17",
      time: "10:30 AM",
      status: "upcoming"
    }
  ];

  return (
    <div className="space-y-4">
      {appointments.length > 0 ? (
        appointments.map((appt) => (
          <Card key={appt.id}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{appt.doctorName}</CardTitle>
              <p className="text-muted-foreground">{appt.specialty}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{appt.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{appt.time}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant={appt.status === "confirmed" ? "default" : "secondary"}>
                {appt.status === "confirmed" ? "Confirmed" : "Upcoming"}
              </Badge>
              <Button variant="outline" size="sm">
                Join Consultation
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No upcoming appointments</p>
          <Button variant="link" className="mt-2">
            Browse Doctors
          </Button>
        </div>
      )}
    </div>
  );
}