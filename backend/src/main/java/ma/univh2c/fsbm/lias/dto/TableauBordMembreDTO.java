package ma.univh2c.fsbm.lias.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableauBordMembreDTO {
    private Long publications;
    private Long reunions;
    private Long demandesMateriel;
    private Long evenements;
}
