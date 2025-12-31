import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AccordionOutlineItem {
  title: string;
  content: React.ReactNode;
  value: string;
}

interface AccordionOutlineProps {
  items: AccordionOutlineItem[];
  defaultValue?: string[];
  className?: string;
}

const AccordionOutline = ({
  items,
  defaultValue,
  className = "w-full space-y-2",
}: AccordionOutlineProps) => {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue}
      className={className}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="rounded-md border border-b last:border-b"
        >
          <AccordionTrigger className="px-5">{item.title}</AccordionTrigger>
          <AccordionContent className="px-5">{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default AccordionOutline;
