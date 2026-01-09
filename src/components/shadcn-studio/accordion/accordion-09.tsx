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
  /** 특정 항목에 커스텀 content 클래스를 적용할 때 사용 */
  contentClassName?: string;
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
          <AccordionContent className={item.contentClassName || "px-5"}>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default AccordionOutline;
