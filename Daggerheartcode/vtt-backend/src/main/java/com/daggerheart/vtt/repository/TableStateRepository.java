package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.TableState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio Spring Data JPA para la entidad TableState.
 */
@Repository
public interface TableStateRepository extends JpaRepository<TableState, Long> {
}
