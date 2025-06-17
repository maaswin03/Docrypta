import React from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Check,
  Shield,
  Truck,
  HeartPulse,
  Thermometer,
  Activity,
  Gauge,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RazorpayOptions {
  key: string;
  key_secret: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
}

export default function Biowear() {
  const { user } = useUser();
  const [quantity, setQuantity] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState("overview");

  const handleSubmit = (amount: number) => {
    if (amount === 0) {
      alert("Please enter an amount");
    } else {
      const options: RazorpayOptions = {
        key: "rzp_test_sz6vXhYYcZATwz",
        key_secret: "Z4OjloVh5GUOpbya26cCKMt7",
        amount: amount * 100,
        currency: "INR",
        name: "BioSync360",
        description: "BioWear Smart Watch Purchase",
        prefill: {
          name: user?.fullName || "Unknown",
          email: user?.primaryEmailAddress?.emailAddress || "Unknown",
          contact: user?.primaryPhoneNumber?.phoneNumber || "Unknown",
        },
        notes: {
          address: "Razorpay Corporate office",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const pay = new (window as any).Razorpay(options);
      pay.open();
    }
  };

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(2599 * quantity);
  };

  const incrementQuantity = () => setQuantity((prev) => Math.min(prev + 1, 5));
  const decrementQuantity = () => setQuantity((prev) => Math.max(prev - 1, 1));

  const features = [
    {
      icon: <HeartPulse className="h-6 w-6 text-blue-600" />,
      title: "Pulse and Heart Rate Monitoring",
      description: [
        "Monitors your pulse and heart rate in real time",
        "Ensures accurate results for everyday health tracking",
        "Advanced photoplethysmography technology",
      ],
    },
    {
      icon: <Thermometer className="h-6 w-6 text-blue-600" />,
      title: "Temperature Monitoring",
      description: [
        "Provides precise body temperature readings",
        "±0.5°C accuracy for reliable measurements",
        "Waterproof design for versatile use",
      ],
    },
    {
      icon: <Activity className="h-6 w-6 text-blue-600" />,
      title: "ECG Monitoring",
      description: [
        "Captures detailed electrocardiogram (ECG) signals",
        "Helps monitor heart rhythm and detect potential irregularities",
        "Medical-grade precision in a compact form",
      ],
    },
    {
      icon: <Gauge className="h-6 w-6 text-blue-600" />,
      title: "Blood Pressure Monitoring",
      description: [
        "Combines heart rate and blood pressure monitoring",
        "Tracks systolic and diastolic pressure",
        "Validated against clinical standards",
      ],
    },
  ];

  const specifications = [
    { name: "Material", value: "Medical-grade silicone + breathable fabric" },
    { name: "Battery Life", value: "Up to 7 days (normal use)" },
    { name: "Charging Time", value: "2 hours (USB-C)" },
    { name: "Connectivity", value: "Bluetooth 5.2 + NFC" },
    { name: "Water Resistance", value: "IP67 (splash and sweat proof)" },
    { name: "Compatibility", value: "iOS & Android" },
    { name: "Warranty", value: "1 year manufacturer warranty" },
    { name: "Weight", value: "45g (single glove)" },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  href="/products"
                  className="hover:text-primary transition-colors"
                >
                  Products
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-primary">
                  BioWear
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-muted/50 p-8 flex justify-center items-center h-96">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMvXFRd3I_wfadP_KkX89_O_oYRZ4YtpU6IQ&s"
                  alt="BioWear Smart Glove"
                  className="h-full object-contain transition-transform hover:scale-105"
                />
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    className="flex-shrink-0 rounded-lg bg-muted/50 p-2 border hover:border-primary transition-colors"
                  >
                    <img
                      src={`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMvXFRd3I_wfadP_KkX89_O_oYRZ4YtpU6IQ&s`}
                      alt={`BioWear view ${i}`}
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Badge
                  variant="outline"
                  className="mb-2 bg-blue-50 text-blue-600"
                >
                  New Generation
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight">
                  BioWear Smart Watch
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Comprehensive health monitoring with cutting-edge sensor
                  technology
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    4.8 (142 reviews)
                  </span>
                  <span className="text-blue-600 text-sm font-medium">
                    Verified Purchase
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold">₹2,599</span>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹3,499
                  </span>
                  <Badge variant="secondary" className="text-sm font-medium">
                    36% OFF
                  </Badge>
                </div>
                <p className="text-green-600 font-medium flex items-center gap-1">
                  <Check className="h-4 w-4" /> In stock (ships in 1-2 business
                  days)
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-lg border px-4 py-2">
                    <button
                      onClick={decrementQuantity}
                      className="px-2 text-lg font-medium text-gray-500 hover:text-gray-900"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      className="px-2 text-lg font-medium text-gray-500 hover:text-gray-900"
                      disabled={quantity >= 5}
                    >
                      +
                    </button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">
                      ₹{(2599 * quantity).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleBuyNow}
                    className="flex-1 h-10 text-lg font-medium"
                  >
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-lg font-medium"
                  >
                    Add to Cart
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3 hover:border-blue-300 transition-colors">
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Free Shipping</p>
                      <p className="text-sm text-muted-foreground">
                        On all orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3 hover:border-blue-300 transition-colors">
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">1 Year Warranty</p>
                      <p className="text-sm text-muted-foreground">
                        Easy returns
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-12"
          >
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-14">
              <TabsTrigger
                value="overview"
                className="relative h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium px-4"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="relative h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium px-4"
              >
                Features
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="relative h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium px-4"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="relative h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium px-4"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview">
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-xl font-semibold mb-4">
                    Revolutionary Health Monitoring
                  </h3>
                  <p>
                    The BioWear Smart Glove is a revolutionary health monitoring
                    device that combines medical-grade sensors with everyday
                    comfort. Designed for athletes, health enthusiasts, and
                    patients alike, it provides continuous tracking of your
                    vital signs with clinical accuracy.
                  </p>
                  <p className="mt-4">
                    With seamless Bluetooth connectivity to our BioSync360 app,
                    you'll get real-time insights and historical trends of your
                    cardiovascular health, temperature patterns, and more - all
                    from the convenience of your wearable device.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Benefits</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>24/7 health monitoring without discomfort</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Medical-grade accuracy in a wearable form</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Early detection of potential health issues
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Ideal For</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Athletes monitoring performance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Patients with chronic conditions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Health-conscious individuals</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features">
                <div className="grid gap-6 md:grid-cols-2">
                  {features.map((feature, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="flex flex-row items-start gap-4 pb-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          {feature.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {feature.description.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="specs">
                <Card>
                  <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                    {specifications.map((spec, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-3 border-b last:border-b-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {spec.name}
                        </span>
                        <span className="text-sm font-medium text-right">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        Customer Reviews
                      </h3>
                      <p className="text-muted-foreground">
                        What our customers say about BioWear
                      </p>
                    </div>
                    <Button variant="outline">Write a Review</Button>
                  </div>

                  <div className="space-y-6">
                    {[1, 2, 3].map((review) => (
                      <Card
                        key={review}
                        className="hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                            <span className="font-medium">
                              Excellent product
                            </span>
                          </div>
                          <p className="mt-3">
                            "The BioWear glove has been a game-changer for my
                            health monitoring. The ECG readings are surprisingly
                            accurate compared to my doctor's equipment."
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Ramesh K.</span>
                            <span>•</span>
                            <span>Verified Buyer</span>
                            <span>•</span>
                            <span>2 weeks ago</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
