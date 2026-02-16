import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { ResourceCard } from "./ResourceCard"
import type { Section } from "../../lib/api/types"

interface SectionAccordionProps {
  sections: Section[]
  onToggle?: (sectionId: string) => void
}

export function SectionAccordion({ sections, onToggle }: SectionAccordionProps) {
  const expandedValues = sections.filter((s) => s.isExpanded).map((s) => s.id)

  return (
    <Accordion
      type="multiple"
      value={expandedValues}
      onValueChange={(values) => {
        if (!onToggle) return
        for (const section of sections) {
          const wasExpanded = section.isExpanded
          const isNowExpanded = values.includes(section.id)
          if (wasExpanded !== isNowExpanded) {
            onToggle(section.id)
          }
        }
      }}
      className="w-full"
    >
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger>{section.title}</AccordionTrigger>
          <AccordionContent>
            <p className="mb-3 text-muted-foreground">{section.content}</p>
            {section.resources.length > 0 && (
              <div className="space-y-2">
                {section.resources.map((resource, i) => (
                  <ResourceCard key={i} resource={resource} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
