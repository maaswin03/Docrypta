import { AppSidebar } from "@/components/Sidebar/app-sidebar";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Faqs() {
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
                <BreadcrumbLink href="/">Resources</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>FAQs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>What is BioSync360?</AccordionTrigger>
              <AccordionContent>
                BioSync360 is your ultimate health companion, combining AI
                technology with expert healthcare services. Our platform offers
                virtual doctor consultations, AI-driven symptom analysis, and
                personalized health recommendations tailored to your readings.
                With a user-friendly dashboard, you can track consultations,
                health metrics, and personalized plans, all in one place. Take
                control of your health effortlessly with BioSync360.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                How does the AI Doctor Consultancy work
              </AccordionTrigger>
              <AccordionContent>
                Our AI Doctor Consultancy provides real-time health insights by
                analyzing your biometric data such as heart rate, blood
                pressure, and temperature. The AI generates personalized
                recommendations and alerts, ensuring timely medical advice. You
                can also connect with certified doctors for more comprehensive
                consultations, blending the power of AI with expert human care.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                What is the AI Personalized Health Plan, and how does it benefit
                me?
              </AccordionTrigger>
              <AccordionContent>
                The AI Personalized Health Plan creates customized wellness
                strategies based on your biometric readings and health goals. It
                monitors your vitals and provides tailored diet, exercise, and
                lifestyle recommendations. These plans adapt dynamically to
                changes in your health data, ensuring you always have actionable
                insights to improve your well-being.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                How does the AI Doctor Consultancy work?
              </AccordionTrigger>
              <AccordionContent>
                The AI Doctor Consultancy allows you to connect with virtual
                healthcare experts for instant medical advice. Using advanced
                algorithms and your health data, it provides accurate
                assessments, recommends next steps, and helps you decide when to
                seek in-person medical attention. This service ensures quick,
                reliable guidance anytime you need it.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                What is AI Personalized Health Plan?
              </AccordionTrigger>
              <AccordionContent>
                It's a custom health plan created using your readings and data
                to fit your unique needs and goals.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Is the AI Doctor Consultation free?
              </AccordionTrigger>
              <AccordionContent>
                The AI Doctor Consultation may have both free and paid options,
                depending on the service level you choose. Check our website for
                details on available packages.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                How can I book an AI Doctor Consultation?
              </AccordionTrigger>
              <AccordionContent>
                You can easily book an AI Doctor Consultation through our
                website dashboard by selecting a time and entering your details.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
