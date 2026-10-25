package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeCanal;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanalDiscussionDTO {
    private Long id;
    private String titre;
    private TypeCanal typeCanal;
    private LocalDateTime dateCreation;
    private List<MembreResumeDTO> participants;
    private Long equipeId;
    private Long evenementId;
    private Long messagesNonLus;
    private MessageDTO dernierMessage;
}
