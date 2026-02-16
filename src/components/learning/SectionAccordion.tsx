import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Badge } from "../ui/badge"
import { ResourceGrid } from "./ResourceGrid"
import type { Section, Citation, VideoMetadata } from "../../lib/api/types"

interface SectionAccordionProps {
  sections: Section[]
  onToggle?: (sectionId: string) => void
  onOpenSource?: (citation: Citation, video?: VideoMetadata) => void
}

export function SectionAccordion({ sections, onToggle, onOpenSource }: SectionAccordionProps) {
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
      {sections.map((section, index) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="gap-3 hover:no-underline">
            <div className="flex flex-1 items-center gap-3 text-left">
              <Badge
                variant="outline"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs font-semibold"
              >
                {index + 1}
              </Badge>
              <span className="flex-1 font-medium">{section.title}</span>
              {section.resources.length > 0 && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {section.resources.length} resource{section.resources.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pl-9">
              <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
              <ResourceGrid resources={section.resources} onOpenSource={onOpenSource} />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
