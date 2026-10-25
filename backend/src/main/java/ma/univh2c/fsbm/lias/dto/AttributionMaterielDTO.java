package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributionMaterielDTO {
    private Long id;
    private Long materielId;
    private String materielDesignation;
    private MembreResumeDTO beneficiaire;
    private LocalDate dateDistribution;
    private LocalDate dateRetour;
    private Integer quantiteAttribuee;
}
