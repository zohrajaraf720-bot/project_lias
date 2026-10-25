package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeAction;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraceAuditDTO {
    private Long id;
    private LocalDateTime dateAction;
    private TypeAction typeAction;
    private String nomEntite;
    private Long idEntite;
    private String descriptionDetails;
    private String auteurNom;
    private String auteurEmail;
}
