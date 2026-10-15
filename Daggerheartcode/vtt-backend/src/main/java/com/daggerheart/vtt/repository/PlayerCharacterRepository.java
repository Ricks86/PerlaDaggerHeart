package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.PlayerCharacter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerCharacterRepository extends JpaRepository<PlayerCharacter, Long> {
    Optional<PlayerCharacter> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}
