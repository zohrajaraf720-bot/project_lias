package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeInstitution;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartenaireDTO {
    private Long id;
    private String nomInstitution;
    private TypeInstitution typeInstitution;
    private String pays;
    private String contactPrincipal;
    private String emailContact;
    private Integer nombreConventions;
}
