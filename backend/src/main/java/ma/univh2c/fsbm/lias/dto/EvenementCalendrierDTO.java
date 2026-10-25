package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeCalendrier;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvenementCalendrierDTO {
    private Long id;
    private String title;
    private LocalDateTime start;
    private LocalDateTime end;
    private TypeCalendrier type;
}
