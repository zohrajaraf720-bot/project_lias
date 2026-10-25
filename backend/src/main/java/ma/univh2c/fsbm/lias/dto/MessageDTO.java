package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private Long id;
    private String contenu;
    private LocalDateTime dateEnvoi;
    private MembreResumeDTO auteur;
    private Long canalId;
}
